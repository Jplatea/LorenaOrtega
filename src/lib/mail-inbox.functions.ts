import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Lee por IMAP los buzones de Lorena (puede tener varios: p.ej.
// hola@ortegacarrion.es y lorenaortega@lorenaortega.es) y guarda los correos en
// Supabase (tabla public.emails) para leerlos desde la web y vincularlos a los
// clientes. El envío sigue por SMTP (src/lib/email.functions.ts).

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

type MailAccount = { id: string; user: string; pass: string; host: string; port: number };

// Cuentas configuradas en Vercel. La primera reutiliza SMTP_USER/SMTP_PASS (las
// mismas que usa el envío); la segunda, MAIL2_USER/MAIL2_PASS. Cada una puede
// fijar su host IMAP (IMAP_HOST / MAIL2_IMAP_HOST); por defecto, IONOS.
function mailAccounts(): MailAccount[] {
  const accs: MailAccount[] = [];
  const defHost = process.env.IMAP_HOST || "imap.ionos.es";
  const defPort = Number(process.env.IMAP_PORT || 993);
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    accs.push({ id: process.env.SMTP_USER, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, host: defHost, port: defPort });
  }
  if (process.env.MAIL2_USER && process.env.MAIL2_PASS) {
    accs.push({
      id: process.env.MAIL2_USER,
      user: process.env.MAIL2_USER,
      pass: process.env.MAIL2_PASS,
      host: process.env.MAIL2_IMAP_HOST || defHost,
      port: Number(process.env.MAIL2_IMAP_PORT || defPort),
    });
  }
  return accs;
}

type AccountResult = {
  account: string;
  ok: boolean;
  fetched?: number;
  inserted?: number;
  updated?: number;
  inboxTotal?: number;
  stage?: "auth" | "imap" | "db";
  error?: string;
};

async function syncOneAccount(
  acc: MailAccount,
  supabase: any,
  byEmail: Map<string, string>,
  want: number,
  ImapFlow: any,
  simpleParser: any,
): Promise<AccountResult> {
  // UID más alto ya guardado para esta cuenta: solo bajamos lo nuevo después.
  const { data: lastRow } = await supabase
    .from("emails").select("uid").eq("account", acc.id).eq("folder", "INBOX")
    .order("uid", { ascending: false }).limit(1).maybeSingle();
  const sinceUid: number = lastRow?.uid ?? 0;

  const client = new ImapFlow({
    host: acc.host, port: acc.port, secure: acc.port === 993,
    auth: { user: acc.user, pass: acc.pass }, logger: false,
    connectionTimeout: 6000, greetingTimeout: 5000, socketTimeout: 15000,
  });
  let inserted = 0, updated = 0, fetched = 0, inboxTotal = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      inboxTotal = (client.mailbox as any)?.exists ?? 0;
      if (inboxTotal === 0) return { account: acc.id, ok: true, fetched: 0, inserted: 0, updated: 0, inboxTotal: 0 };

      const range = sinceUid > 0 ? `${sinceUid + 1}:*` : `${Math.max(1, inboxTotal - want + 1)}:*`;
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

        let clientId: string | null = byEmail.get(fromAddr) ?? null;
        if (!clientId) for (const t of tos) { const id = byEmail.get(t.trim().toLowerCase()); if (id) { clientId = id; break; } }

        const when = parsed.date || msg.envelope?.date || null;
        rows.push({
          account: acc.id,
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
          date: when ? new Date(when).toISOString() : null,
          preview,
          body_text: text || null,
          body_html: html,
          has_attachments: Array.isArray(parsed.attachments) && parsed.attachments.length > 0,
          seen: flags.includes("\\Seen"),
          answered: flags.includes("\\Answered"),
          client_id: clientId,
        });
      }

      if (rows.length) {
        const uids = rows.map((r) => r.uid);
        const { data: existing } = await supabase
          .from("emails").select("uid").eq("account", acc.id).eq("folder", "INBOX").in("uid", uids);
        const existingSet = new Set((existing ?? []).map((e: any) => e.uid));
        inserted = rows.filter((r) => !existingSet.has(r.uid)).length;
        updated = rows.length - inserted;
        const { error: upErr } = await supabase.from("emails").upsert(rows, { onConflict: "account,folder,uid" });
        if (upErr) return { account: acc.id, ok: false, stage: "db", error: upErr.message, fetched };
      }
    } finally {
      lock.release();
    }
    await client.logout();
    return { account: acc.id, ok: true, fetched, inserted, updated, inboxTotal };
  } catch (e: any) {
    try { await client.logout(); } catch {}
    const authFailed = e?.authenticationFailed || /auth/i.test(String(e?.message || ""));
    return {
      account: acc.id,
      ok: false,
      stage: authFailed ? "auth" : "imap",
      error: authFailed
        ? "IONOS rechazó las credenciales (usuario o contraseña incorrectos, o IMAP no habilitado)."
        : "No se pudo conectar: " + String(e?.message || e).slice(0, 140),
    };
  }
}

const syncSchema = z.object({ limit: z.number().int().min(1).max(200).optional() }).optional();

export const syncInbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (syncSchema.parse(d) ?? {}))
  .handler(async ({ data, context }) => {
    const logResult = async (summary: any) => {
      try { await context.supabase.from("mail_sync_log").insert({ result: summary }); } catch {}
      return summary;
    };

    // Tope de tiempo por cuenta: si IMAP se cuelga, resolvemos con error en vez
    // de dejar que la función de Vercel caduque sin registrar nada.
    const withTimeout = (p: Promise<AccountResult>, acc: MailAccount, ms: number): Promise<AccountResult> =>
      Promise.race([
        p,
        new Promise<AccountResult>((resolve) =>
          setTimeout(() => resolve({ account: acc.id, ok: false, stage: "imap", error: `Tiempo de espera agotado (${ms / 1000}s) conectando a ${acc.host}.` }), ms),
        ),
      ]);

    try {
      await assertAdmin(context.supabase, context.userId);

      const accounts = mailAccounts();
      if (accounts.length === 0) {
        return await logResult({
          ok: false,
          stage: "config",
          error: "El correo no está configurado todavía (faltan las credenciales de los buzones en Vercel).",
          accountsDetected: [],
          envSeen: { SMTP_USER: !!process.env.SMTP_USER, SMTP_PASS: !!process.env.SMTP_PASS, MAIL2_USER: !!process.env.MAIL2_USER, MAIL2_PASS: !!process.env.MAIL2_PASS },
        });
      }

      const want = data?.limit ?? 5;
      const { ImapFlow } = await import("imapflow");
      const { simpleParser } = await import("mailparser");

      // Mapa email(minúsculas) -> client_id para vincular.
      const { data: profs } = await context.supabase.from("profiles").select("id, email");
      const byEmail = new Map<string, string>();
      for (const p of profs ?? []) if (p.email) byEmail.set(String(p.email).trim().toLowerCase(), p.id);

      const results: AccountResult[] = [];
      for (const acc of accounts) {
        results.push(await withTimeout(syncOneAccount(acc, context.supabase, byEmail, want, ImapFlow, simpleParser), acc, 8000));
      }

      const inserted = results.reduce((n, r) => n + (r.inserted ?? 0), 0);
      const updated = results.reduce((n, r) => n + (r.updated ?? 0), 0);
      const fetched = results.reduce((n, r) => n + (r.fetched ?? 0), 0);
      const okAny = results.some((r) => r.ok);
      const failed = results.filter((r) => !r.ok);

      return await logResult({
        ok: okAny,
        inserted,
        updated,
        fetched,
        accounts: results,
        accountsDetected: accounts.map((a) => ({ id: a.id, host: a.host, port: a.port })),
        error: failed.length ? failed.map((r) => `${r.account}: ${r.error}`).join(" · ") : undefined,
      });
    } catch (e: any) {
      return await logResult({ ok: false, stage: "fatal", error: String(e?.message || e).slice(0, 200) });
    }
  });
