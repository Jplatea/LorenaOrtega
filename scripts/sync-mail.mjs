// Sincronización de correo en SEGUNDO PLANO (sin la web abierta).
// Lo ejecuta el cron de GitHub Actions (.github/workflows/mail-sync.yml).
// Lee los buzones de IONOS por IMAP y guarda los correos en Supabase, igual que
// el botón "Sincronizar" de la web (src/lib/mail-inbox.functions.ts), pero con
// la service-role key (sin sesión de administradora).
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  // Salida suave: aún no se han configurado los secretos en GitHub. No fallamos
  // el job para no mandar avisos de error; en cuanto estén, sincroniza.
  console.log("Pendiente de configurar: faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (añade los secretos en GitHub).");
  process.exit(0);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function accounts() {
  const list = [];
  const imapHost = process.env.IMAP_HOST || "imap.ionos.es";
  const imapPort = Number(process.env.IMAP_PORT || 993);
  if (process.env.SMTP_USER && process.env.SMTP_PASS)
    list.push({ id: process.env.SMTP_USER, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, host: imapHost, port: imapPort });
  if (process.env.MAIL2_USER && process.env.MAIL2_PASS)
    list.push({ id: process.env.MAIL2_USER, user: process.env.MAIL2_USER, pass: process.env.MAIL2_PASS, host: process.env.MAIL2_IMAP_HOST || imapHost, port: Number(process.env.MAIL2_IMAP_PORT || imapPort) });
  return list;
}

function normalizeSubject(s) {
  return String(s || "").replace(/^(\s*(re|rv|fwd|fw|reenv)\s*:\s*)+/i, "").trim().toLowerCase().slice(0, 200);
}
function addrList(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.flatMap(addrList);
  if (x.value && Array.isArray(x.value)) return x.value;
  return [];
}

async function syncOne(acc, byEmail, want) {
  const { data: lastRow } = await supabase
    .from("emails").select("uid").eq("account", acc.id).eq("folder", "INBOX")
    .order("uid", { ascending: false }).limit(1).maybeSingle();
  const sinceUid = lastRow?.uid ?? 0;

  const client = new ImapFlow({
    host: acc.host, port: acc.port, secure: acc.port === 993,
    auth: { user: acc.user, pass: acc.pass }, logger: false,
    connectionTimeout: 15000, greetingTimeout: 12000, socketTimeout: 60000,
  });
  let inserted = 0, updated = 0, fetched = 0, inboxTotal = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      inboxTotal = client.mailbox?.exists ?? 0;
      if (inboxTotal === 0) return { account: acc.id, ok: true, fetched: 0, inserted: 0, updated: 0, inboxTotal: 0 };
      const range = sinceUid > 0 ? `${sinceUid + 1}:*` : `${Math.max(1, inboxTotal - want + 1)}:*`;
      const rows = [];
      for await (const msg of client.fetch(range, { uid: true, envelope: true, source: true, flags: true }, { uid: sinceUid > 0 })) {
        fetched++;
        let parsed = {};
        try { parsed = await simpleParser(msg.source); } catch { parsed = {}; }
        const flags = [...(msg.flags || [])];
        const from = addrList(parsed.from)[0] || {};
        const tos = addrList(parsed.to).map((a) => a.address).filter(Boolean);
        const ccs = addrList(parsed.cc).map((a) => a.address).filter(Boolean);
        const subject = parsed.subject || msg.envelope?.subject || "";
        const text = parsed.text || "";
        const html = parsed.html || parsed.textAsHtml || null;
        const preview = String(text).replace(/\s+/g, " ").trim().slice(0, 240);
        const fromAddr = (from.address || "").trim().toLowerCase();
        let clientId = byEmail.get(fromAddr) ?? null;
        if (!clientId) for (const t of tos) { const id = byEmail.get(t.trim().toLowerCase()); if (id) { clientId = id; break; } }
        const when = parsed.date || msg.envelope?.date || null;
        rows.push({
          account: acc.id, folder: "INBOX", uid: Number(msg.uid), direction: "in",
          message_id: parsed.messageId || msg.envelope?.messageId || null,
          in_reply_to: parsed.inReplyTo || null, thread_key: normalizeSubject(subject),
          from_name: from.name || null, from_addr: from.address || null,
          to_addrs: tos, cc_addrs: ccs, subject,
          date: when ? new Date(when).toISOString() : null,
          preview, body_text: text || null, body_html: html,
          has_attachments: Array.isArray(parsed.attachments) && parsed.attachments.length > 0,
          seen: flags.includes("\\Seen"), answered: flags.includes("\\Answered"), client_id: clientId,
        });
      }
      if (rows.length) {
        const uids = rows.map((r) => r.uid);
        const { data: existing } = await supabase.from("emails").select("uid").eq("account", acc.id).eq("folder", "INBOX").in("uid", uids);
        const existingSet = new Set((existing ?? []).map((e) => e.uid));
        inserted = rows.filter((r) => !existingSet.has(r.uid)).length;
        updated = rows.length - inserted;
        const { error } = await supabase.from("emails").upsert(rows, { onConflict: "account,folder,uid" });
        if (error) return { account: acc.id, ok: false, stage: "db", error: error.message, fetched };
      }
    } finally { lock.release(); }
    await client.logout();
    return { account: acc.id, ok: true, fetched, inserted, updated, inboxTotal };
  } catch (e) {
    try { await client.logout(); } catch {}
    const authFailed = e?.authenticationFailed || /auth/i.test(String(e?.message || ""));
    return { account: acc.id, ok: false, stage: authFailed ? "auth" : "imap", error: String(e?.message || e).slice(0, 160) };
  }
}

async function main() {
  const accs = accounts();
  if (accs.length === 0) { console.log("Pendiente: faltan credenciales de buzón (SMTP_PASS / MAIL2_PASS en secretos)."); process.exit(0); }

  const { data: profs } = await supabase.from("profiles").select("id, email");
  const byEmail = new Map();
  for (const p of profs ?? []) if (p.email) byEmail.set(String(p.email).trim().toLowerCase(), p.id);

  const want = Number(process.env.FIRST_SYNC_LIMIT || 40);
  const results = [];
  for (const acc of accs) results.push(await syncOne(acc, byEmail, want));

  const inserted = results.reduce((n, r) => n + (r.inserted ?? 0), 0);
  const summary = { ok: results.some((r) => r.ok), via: "cron", inserted, accounts: results, at: new Date().toISOString() };
  try { await supabase.from("mail_sync_log").insert({ result: summary }); } catch {}
  console.log(JSON.stringify(summary, null, 2));
  // No fallamos el job por un error de un buzón (para no spamear con fallos);
  // queda registrado en mail_sync_log y en el log del propio job.
}

main().catch((e) => { console.error("FALLO:", e); process.exit(1); });
