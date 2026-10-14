import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Toda la comunicación de Lorena con sus clientes sale de su propio buzón de
// IONOS (hola@lorenaortega.es) por SMTP: sin terceros, y las respuestas de los
// clientes llegan a esa misma bandeja.
const CLIENT_WEB = "https://www.lorenaortega.es";

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

// Envío por SMTP de IONOS (nodemailer). Lee la config de env en Vercel.
async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const host = process.env.SMTP_HOST || "smtp.ionos.es";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER; // hola@lorenaortega.es
  const pass = process.env.SMTP_PASS;
  const fromName = process.env.SMTP_FROM_NAME || "Lorena Ortega";
  if (!user || !pass) throw new Error("El correo no está configurado todavía (faltan las credenciales SMTP de IONOS).");
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const info = await transport.sendMail({ from: `${fromName} <${user}>`, to, replyTo: user, subject, text, html });
  return info.messageId as string | undefined;
}

// --- Plantilla simple (texto libre que escribe Lorena) --------------------
function renderEmail({ subject, message }: { subject: string; message: string }) {
  const body = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const INK = "#2f3b34", SOFT = "#7c8a82", GREEN = "#5FB98E", CREAM = "#f6f4ef", LINE = "#e7e3da";
  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" /><title>${escapeHtml(subject)}</title>
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500&display=swap" rel="stylesheet" /><!--<![endif]-->
<style>body,td,p,a,span,div,h1 { font-family:'Poppins','Century Gothic',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }</style>
</head><body style="margin:0;padding:32px 16px;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:0 4px 18px;"><span style="font-size:17px;font-weight:500;color:${INK};letter-spacing:0.2px;">Lorena Ortega<span style="color:${GREEN};"> ·</span> <span style="font-weight:300;color:${SOFT};">Dietética</span></span></td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:18px;padding:30px 30px 26px;"><div style="font-size:15px;line-height:1.75;font-weight:300;color:${INK};">${body}</div></td></tr>
    <tr><td style="padding:18px 8px 0;text-align:center;"><p style="margin:0;font-size:11px;color:${SOFT};">Lorena Ortega · Dietética · hola@lorenaortega.es</p></td></tr>
  </table>
</body></html>`;
}

// --- Tarjeta "dieta disponible" (fondo chirimoya, estilo tarjeta) ---------
// La foto de la chirimoya se sirve desde la propia web
// (public/images/email/chirimoya.jpg). Si todavía no está, queda el verde de
// fondo (bgcolor) y la tarjeta se lee igual.
const CHIRIMOYA_IMG = `${CLIENT_WEB}/images/email/chirimoya.jpg`;

function renderDietCard({ name }: { name: string }) {
  const INK = "#2f3b34", SOFT = "#7c8a82", GREEN = "#5FB98E", CREAM = "#f6f4ef", LINE = "#e7e3da";
  const hello = `Estimad@${name ? " " + escapeHtml(name) : ""},`;
  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" /><meta name="color-scheme" content="light" />
<title>Tu dieta ya está disponible</title>
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500&display=swap" rel="stylesheet" /><!--<![endif]-->
<style>body,td,p,a,span,div,h1 { font-family:'Poppins','Century Gothic',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }</style>
</head><body style="margin:0;padding:0;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:30px 12px 40px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;">
        <tr><td align="center" style="padding:0 0 16px;font-size:17px;font-weight:500;color:${INK};">Lorena Ortega<span style="color:${GREEN};"> ·</span> <span style="font-weight:300;color:${SOFT};">Dietética</span></td></tr>
        <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td background="${CHIRIMOYA_IMG}" bgcolor="${GREEN}" valign="bottom" height="190" style="height:190px;background-image:url('${CHIRIMOYA_IMG}');background-size:cover;background-position:center;background-color:${GREEN};border-radius:20px 20px 0 0;">
                <!--[if gte mso 9]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:560px;height:190px;">
                  <v:fill type="frame" src="${CHIRIMOYA_IMG}" color="${GREEN}" /><v:textbox inset="0,0,0,0"><div>
                <![endif]-->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:120px 34px 22px;">
                  <p style="margin:0 0 6px;font-size:10px;font-weight:500;letter-spacing:2.4px;text-transform:uppercase;color:#eafaf2;">Tu plan</p>
                  <p style="margin:0;font-size:27px;line-height:33px;font-weight:300;color:#ffffff;text-shadow:0 1px 6px rgba(0,0,0,0.35);">Tu dieta ya está lista</p>
                </td></tr></table>
                <!--[if gte mso 9]></div></v:textbox></v:rect><![endif]-->
              </td>
            </tr>
            <tr><td style="padding:28px 34px 6px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.7;font-weight:400;color:${INK};">${hello}</p>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.75;font-weight:300;color:${INK};">Ya tienes disponible tu nueva dieta en tu área privada. Entra cuando quieras para verla por días, consultar las recetas y descargarla.</p>
            </td></tr>
            <tr><td align="center" style="padding:0 34px 4px;">
              <!--[if mso]><v:roundrect href="${CLIENT_WEB}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="50%" stroke="f" fillcolor="${GREEN}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;">Ver mi dieta</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-->
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background:${GREEN};">
                <a href="${CLIENT_WEB}" style="display:inline-block;padding:14px 34px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">Ver mi dieta</a>
              </td></tr></table>
              <!--<![endif]-->
            </td></tr>
            <tr><td align="center" style="padding:14px 34px 0;">
              <a href="${CLIENT_WEB}" style="font-size:12px;color:${SOFT};text-decoration:none;">${CLIENT_WEB.replace("https://", "")}</a>
            </td></tr>
            <tr><td height="28" style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:16px 20px 0;font-size:11px;color:${SOFT};">Lorena Ortega · Dietética · hola@lorenaortega.es</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// --- Server functions -----------------------------------------------------
const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(20000),
});

export const sendClientEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    try {
      const id = await sendMail({
        to: data.to,
        subject: data.subject,
        text: data.message,
        html: renderEmail({ subject: data.subject, message: data.message }),
      });
      return { ok: true, id };
    } catch (e: any) {
      throw new Error("No se pudo enviar el correo: " + (e?.message ?? "error SMTP"));
    }
  });

const dietSchema = z.object({ patientId: z.string().uuid() });

export const sendDietAvailableEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => dietSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: p } = await context.supabase
      .from("profiles")
      .select("email, first_name")
      .eq("id", data.patientId)
      .maybeSingle();
    if (!p?.email) throw new Error("Este cliente no tiene un correo guardado en su ficha.");
    try {
      const id = await sendMail({
        to: p.email,
        subject: "Tu dieta ya está disponible",
        text: `Estimad@${p.first_name ? " " + p.first_name : ""}, ya tienes disponible tu nueva dieta en tu área privada: ${CLIENT_WEB}`,
        html: renderDietCard({ name: p.first_name ?? "" }),
      });
      return { ok: true, id, to: p.email as string };
    } catch (e: any) {
      throw new Error("No se pudo enviar el correo: " + (e?.message ?? "error SMTP"));
    }
  });
