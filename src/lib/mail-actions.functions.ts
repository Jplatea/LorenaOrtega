import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accountById } from "@/lib/mail-config";

// Acciones sobre los correos de Lorena: responder, reenviar y borrar, usando el
// buzón (cuenta) al que pertenece cada correo. La lectura está en
// mail-inbox.functions.ts; el envío de plantillas, en email.functions.ts.

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error("No autorizado");
  if (!data) throw new Error("Solo administradores");
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderSimple(message: string) {
  const body = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const INK = "#2f3b34", CREAM = "#f6f4ef", LINE = "#e7e3da";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>body,td,p,div{font-family:'Poppins','Century Gothic',-apple-system,Helvetica,Arial,sans-serif;}</style>
</head><body style="margin:0;padding:28px 16px;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:18px;padding:26px 28px;">
      <div style="font-size:15px;line-height:1.7;font-weight:300;color:${INK};">${body}</div>
    </td></tr>
  </table>
</body></html>`;
}

const sendSchema = z.object({
  account: z.string().min(1),
  to: z.string().min(3).max(400), // puede incluir varias direcciones separadas por coma
  subject: z.string().min(1).max(300),
  message: z.string().min(1).max(50000),
  inReplyTo: z.string().max(400).optional(),
  references: z.string().max(4000).optional(),
  originalId: z.string().uuid().optional(), // para marcar el original como respondido
});

export const sendMailFrom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const acc = accountById(data.account);
    if (!acc) throw new Error("No se encuentra la configuración de ese buzón en Vercel.");

    const fromName = process.env.SMTP_FROM_NAME || "Lorena Ortega";
    const { default: nodemailer } = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: acc.smtpHost, port: acc.smtpPort, secure: acc.smtpPort === 465,
      auth: { user: acc.user, pass: acc.pass },
    });
    try {
      const info = await transport.sendMail({
        from: `${fromName} <${acc.user}>`,
        to: data.to,
        replyTo: acc.user,
        subject: data.subject,
        text: data.message,
        html: renderSimple(data.message),
        inReplyTo: data.inReplyTo || undefined,
        references: data.references || undefined,
      });
      // Marcar el correo original como respondido (si aplica).
      if (data.originalId) {
        try { await context.supabase.from("emails").update({ answered: true }).eq("id", data.originalId); } catch {}
      }
      return { ok: true, id: info.messageId as string | undefined };
    } catch (e: any) {
      throw new Error("No se pudo enviar: " + (e?.message ?? "error SMTP"));
    }
  });

const delSchema = z.object({
  id: z.string().uuid(),
  account: z.string().min(1),
  uid: z.number().int().positive(),
});

export const deleteEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => delSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const acc = accountById(data.account);

    // Intentar mover a la papelera en el servidor IMAP (recuperable). Si no se
    // puede, al menos quitamos el correo de la bandeja de la web.
    let serverDeleted = false;
    let note: string | undefined;
    if (acc) {
      const { ImapFlow } = await import("imapflow");
      const client = new ImapFlow({
        host: acc.imapHost, port: acc.imapPort, secure: acc.imapPort === 993,
        auth: { user: acc.user, pass: acc.pass }, logger: false,
        connectionTimeout: 6000, greetingTimeout: 5000, socketTimeout: 15000,
      });
      try {
        await client.connect();
        // Buscar carpeta de papelera (special-use \Trash o por nombre).
        let trash: string | null = null;
        try {
          for await (const box of client.list()) {
            const su = (box as any).specialUse;
            if (su === "\\Trash") { trash = box.path; break; }
            if (!trash && /trash|papelera|deleted/i.test(box.path)) trash = box.path;
          }
        } catch {}
        const lock = await client.getMailboxLock("INBOX");
        try {
          if (trash) {
            await client.messageMove(String(data.uid), trash, { uid: true });
          } else {
            await client.messageDelete(String(data.uid), { uid: true });
          }
          serverDeleted = true;
        } finally {
          lock.release();
        }
        await client.logout();
      } catch (e: any) {
        try { await client.logout(); } catch {}
        note = "No se pudo borrar en el servidor de correo: " + String(e?.message || e).slice(0, 120);
      }
    } else {
      note = "Sin configuración del buzón; se quita solo de la web.";
    }

    // Quitar de la bandeja de la web.
    const { error } = await context.supabase.from("emails").delete().eq("id", data.id);
    if (error) throw new Error("No se pudo quitar de la bandeja: " + error.message);

    return { ok: true, serverDeleted, note };
  });
