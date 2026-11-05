import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Lee el buzón de IONOS (hola@lorenaortega.es) por IMAP y guarda los correos en
// Supabase (tabla public.emails) para que Lorena los lea desde la propia web y
// los vincule a sus clientes. El envío sigue por SMTP (src/lib/email.functions.ts).

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error("No autorizado");
  if (!data) throw new Error("Solo administradores");
}

function normalizeSubject(s: string | undefined): string {
  return String(s || "")
    .replace(/^(\s*(re|rv|fwd|fw|reenv)\s*:\s*)+/i, "")
    .trim()
    .toLowerCase()
    .slice(0, 200);
}

function addrList(x: any): { name?: string; address?: string }[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.flatMap(addrList);
  if (x.value && Array.isArray(x.value)) return x.value;
  return [];
}

const syncSchema = z.object({ limit: z.number().int().min(1).max(200).optional() }).optional();

export const syncInbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (syncSchema.parse(d) ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const host = process.env.IMAP_HOST || "imap.ionos.es";
    const port = Number(process.env.IMAP_PORT || 993);
    const user = process.env.SMTP_USER; // mismo buzón que el envío
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
      return { ok: false, error: "El correo no está configurado todavía (faltan las credenciales de IONOS).", stage: "config" as const };
    }

    const want = data?.limit ?? 60;
    const { ImapFlow } = await import("imapflow");
    const { simpleParser } = await import("mailparser");

    // UID más alto ya guardado: solo bajamos lo nuevo en sincronizaciones sucesivas.
    const { data: lastRow } = await context.supabase
      .from("emails").select("uid").eq("folder", "INBOX").order("uid", { ascending: false }).limit(1).maybeSingle();
    const sinceUid: number = lastRow?.uid ?? 0;

    // Mapa email(minúsculas) -> client_id para vincular.
    const { data: profs } = await context.supabase.from("profiles").select("id, email");
    const byEmail = new Map<string, string>();
    for (const p of profs ?? []) if (p.email) byEmail.set(String(p.email).trim().toLowerCase(), p.id);

    const client = new ImapFlow({ host, port, secure: port === 993, auth: { user, pass }, logger: false });
    let inserted = 0, updated = 0, fetched = 0, inboxTotal = 0;
    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        const mbox: any = client.mailbox;
        inboxTotal = mbox?.exists ?? 0;

        // Rango por UID: lo nuevo desde el último, o los últimos `want` en el primer sync.
        let range: string;
        if (sinceUid > 0) {
          range = `${sinceUid + 1}:*`;
        } else {
          const start = Math.max(1, inboxTotal - want + 1);
          range = `${start}:*`;
        }
        if (inboxTotal === 0) {
          return { ok: true, folder: "INBOX", fetched: 0, inserted: 0, updated: 0, inboxTotal: 0 };
        }

        const rows: any[] = [];
        for await (const msg of client.fetch(range, { uid: true, envelope: true, source: true, flags: true }, { uid: sinceUid > 0 })) {
          fetched++;
          let parsed: any = {};
          try { parsed = await simpleParser(msg.source as Buffer); } catch { parsed = {}; }
          const flags = [...(msg.flags || [])];
          const from = addrList(parsed.from)[0] || {};
          const tos = addrList(parsed.to).map((a) => a.address).filter(Boolean) as string[];
          const ccs = addrList(parsed.cc).map((a) => a.address).filter(Boolean) as string[];
          const subject = parsed.subject || msg.envelope?.subject || "";
          const text = parsed.text || "";
          const html = parsed.html || parsed.textAsHtml || null;
          const preview = String(text).replace(/\s+/g, " ").trim().slice(0, 240);
          const fromAddr = (from.address || "").trim().toLowerCase();

          // Vincular cliente: primero el remitente; si no, algún destinatario.
          let clientId: string | null = byEmail.get(fromAddr) ?? null;
          if (!clientId) for (const t of tos) { const id = byEmail.get(t.trim().toLowerCase()); if (id) { clientId = id; break; } }

          rows.push({
            folder: "INBOX",
            uid: Number(msg.uid),
            direction: "in",
            message_id: parsed.messageId || msg.envelope?.messageId || null,
            in_reply_to: parsed.inReplyTo || null,
            thread_key: normalizeSubject(subject),
            from_name: from.name || null,
            from_addr: from.address || null,
            to_addrs: tos,
            cc_addrs: ccs,
            subject,
            date: (parsed.date || msg.envelope?.date || null) ? new Date(parsed.date || msg.envelope?.date).toISOString() : null,
            preview,
            body_text: text || null,
            body_html: html,
            has_attachments: Array.isArray(parsed.attachments) && parsed.attachments.length > 0,
            seen: flags.includes("\\Seen"),
            answered: flags.includes("\\Answered"),
            client_id: clientId,
          });
        }

        // Upsert por (folder, uid). Contamos nuevos vs existentes antes de escribir.
        if (rows.length) {
          const uids = rows.map((r) => r.uid);
          const { data: existing } = await context.supabase
            .from("emails").select("uid").eq("folder", "INBOX").in("uid", uids);
          const existingSet = new Set((existing ?? []).map((e: any) => e.uid));
          inserted = rows.filter((r) => !existingSet.has(r.uid)).length;
          updated = rows.length - inserted;
          const { error: upErr } = await context.supabase
            .from("emails").upsert(rows, { onConflict: "folder,uid" });
          if (upErr) return { ok: false, error: "Guardado: " + upErr.message, stage: "db" as const, fetched };
        }
      } finally {
        lock.release();
      }
      await client.logout();
      return { ok: true, folder: "INBOX", fetched, inserted, updated, inboxTotal };
    } catch (e: any) {
      try { await client.logout(); } catch {}
      const authFailed = e?.authenticationFailed || /auth/i.test(String(e?.message || ""));
      return {
        ok: false,
        stage: authFailed ? ("auth" as const) : ("imap" as const),
        error: authFailed
          ? "IONOS rechazó las credenciales de correo (usuario o contraseña incorrectos, o IMAP no habilitado)."
          : "No se pudo conectar al buzón: " + String(e?.message || e).slice(0, 160),
      };
    }
  });
