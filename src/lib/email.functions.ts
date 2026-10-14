import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Remitente de toda la comunicación de Lorena con sus clientes.
const FROM = "Lorena Ortega <hola@lorenaortega.es>";
const REPLY_TO = "hola@lorenaortega.es";

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

// Plantilla limpia y minimalista con la identidad de Lorena (crema + verde,
// Poppins). El cuerpo es el texto que escribe Lorena, respetando sus saltos
// de línea. Maquetación con tablas e inline styles para que renderice bien
// en todos los clientes de correo.
function renderEmail({ subject, message }: { subject: string; message: string }) {
  const body = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const INK = "#2f3b34", SOFT = "#7c8a82", GREEN = "#5FB98E", CREAM = "#f6f4ef", LINE = "#e7e3da";
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(subject)}</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500&display=swap" rel="stylesheet" />
<!--<![endif]-->
<style>
  body,td,p,a,span,div,h1 { font-family:'Poppins','Century Gothic',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }
</style>
</head>
<body style="margin:0;padding:32px 16px;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:0 4px 18px;">
      <span style="font-size:17px;font-weight:500;color:${INK};letter-spacing:0.2px;">Lorena Ortega<span style="color:${GREEN};"> ·</span> <span style="font-weight:300;color:${SOFT};">Dietética</span></span>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:18px;padding:30px 30px 26px;">
      <div style="font-size:15px;line-height:1.75;font-weight:300;color:${INK};">${body}</div>
    </td></tr>
    <tr><td style="padding:18px 8px 0;text-align:center;">
      <p style="margin:0;font-size:11px;color:${SOFT};">Lorena Ortega · Dietética · hola@lorenaortega.es</p>
    </td></tr>
  </table>
</body>
</html>`;
}

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
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("El correo no está configurado todavía (falta la API key de Resend).");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [data.to],
        reply_to: REPLY_TO,
        subject: data.subject,
        html: renderEmail({ subject: data.subject, message: data.message }),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error("No se pudo enviar el correo. " + detail.slice(0, 200));
    }
    const j = await res.json().catch(() => ({}));
    return { ok: true, id: j.id as string | undefined };
  });
