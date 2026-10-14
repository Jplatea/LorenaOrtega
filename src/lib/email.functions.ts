import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Toda la comunicación de Lorena con sus clientes sale de su propio buzón de
// IONOS (hola@lorenaortega.es) por SMTP: sin terceros, y las respuestas de los
// clientes llegan a esa misma bandeja.
const CLIENT_WEB = "https://www.lorenaortega.es";
const CHIRIMOYA_IMG = `${CLIENT_WEB}/images/email/chirimoya.jpg`;
const FIRMA_IMG = `${CLIENT_WEB}/images/email/firma.jpg`;

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
    <tr><td style="padding:22px 0 0;text-align:center;"><img src="${FIRMA_IMG}" width="560" alt="Lorena Ortega · Nutrición · Salud · Bienestar · 658 894 356 · lorena@lorenaortega.es · @lorenaortega · Málaga y online" style="width:100%;max-width:560px;height:auto;display:block;border:0;outline:none;border-radius:14px;" /></td></tr>
  </table>
</body></html>`;
}

// --- Tarjeta "dieta disponible" (foto de chirimoya a sangre, tarjeta blanca
//     con el texto y botón; VML para que Outlook también muestre el fondo).
//     Misma estructura que la plantilla estándar de ILEADS, con la chirimoya.
const CARD_BG = "#20382c";   // verde muy oscuro = fondo del hero
const BRAND = "#5FB98E";     // botón

function renderDietCard({ name }: { name: string }) {
  const hello = `Estimad@${name ? " " + escapeHtml(name) : ""},`;
  const contentRows = (onImage: boolean) => `
    <tr><td align="center" style="padding:${onImage ? "36px" : "26px"} 30px 0;">
      <p style="margin:0;font-size:13px;font-weight:400;color:#eafaf2;letter-spacing:0.4px;">Tu plan de alimentación</p>
      <p class="big" style="margin:6px 0 0;font-size:58px;line-height:62px;font-weight:300;color:#ffffff;letter-spacing:0.5px;">Tu dieta</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 30px 0;">
      <table role="presentation" class="note" width="80%" cellpadding="0" cellspacing="0" border="0" style="width:80%;background:#ffffff;border-radius:20px;">
        <tr><td align="left" style="padding:20px 22px 12px;">
          <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:2px;color:${BRAND};">DIETA DISPONIBLE</p>
          <p style="margin:4px 0 0;font-size:34px;line-height:38px;font-weight:300;color:#20382c;">&#10003;</p>
        </td></tr>
        <tr><td style="padding:0 14px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f4f0;border-radius:14px;">
            <tr><td align="left" style="padding:14px 16px 12px;">
              <p style="margin:0 0 10px;font-size:14px;line-height:21px;color:#20382c;">${hello}</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:21px;color:#5b6b63;">Ya tienes disponible tu nueva dieta en tu área privada: <a href="${CLIENT_WEB}" style="color:#3f8a66;font-weight:500;text-decoration:underline;">www.lorenaortega.es</a>. Entra cuando quieras para verla por días, consultar las recetas y descargarla.</p>
              <p style="margin:0;font-size:11px;color:${BRAND};">Ahora</p>
              <p style="margin:6px 0 0;font-size:12px;font-weight:500;color:#20382c;">Lorena Ortega · Dietética</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:34px 30px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr><td align="center" bgcolor="${BRAND}" style="background:${BRAND};border-radius:30px;">
          <a href="${CLIENT_WEB}" style="display:inline-block;padding:16px 34px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">Entrar en mi área &nbsp;&rarr;</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:16px 30px ${onImage ? "52px" : "44px"};">
      <a href="${CLIENT_WEB}" style="font-size:12.5px;color:#eafaf2;text-decoration:underline;">Ver mi dieta</a>
    </td></tr>`;

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" /><meta name="color-scheme" content="light" />
<title>Tu dieta ya está disponible</title>
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" /><!--<![endif]-->
<style>
  body { margin:0; padding:0; width:100% !important; background:#f6f4ef; }
  table { border-collapse:collapse; }
  img { border:0; outline:none; text-decoration:none; display:block; }
  td,p,a,span,div { font-family:'Poppins','Century Gothic',Helvetica,Arial,sans-serif; }
  @media only screen and (max-width:620px) { .wrap { width:100% !important; } .big { font-size:46px !important; line-height:50px !important; } .note { width:90% !important; } }
</style>
</head><body style="margin:0;padding:0;background:#f6f4ef;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f6f4ef;">Tu nueva dieta ya está disponible en tu área privada.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f4ef;">
    <tr><td align="center" style="padding:26px 12px 34px;">
      <!--[if mso]>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;">
        <tr><td style="font-size:0;line-height:0;"><img src="${CHIRIMOYA_IMG}" width="600" alt="" style="width:600px;display:block;" /></td></tr>
        <tr><td bgcolor="${CARD_BG}" style="background:${CARD_BG};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${contentRows(false)}</table></td></tr>
      </table>
      <![endif]-->
      <!--[if !mso]><!-->
      <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr><td background="${CHIRIMOYA_IMG}" bgcolor="${CARD_BG}" valign="top" style="background-image:url('${CHIRIMOYA_IMG}');background-size:cover;background-position:center;background-color:${CARD_BG};border-radius:26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${contentRows(true)}</table>
        </td></tr>
      </table>
      <!--<![endif]-->
      <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr><td align="center" style="padding:22px 0 0;"><img src="${FIRMA_IMG}" width="600" alt="Lorena Ortega · Nutrición · Salud · Bienestar · 658 894 356 · lorena@lorenaortega.es · @lorenaortega · Málaga y online" style="width:100%;max-width:600px;height:auto;display:block;border:0;outline:none;border-radius:14px;" /></td></tr>
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
