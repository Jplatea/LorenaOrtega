// Configuración de los buzones de correo de Lorena (IONOS). Centralizada para
// que la lectura (IMAP), el envío (SMTP) y el borrado usen las mismas cuentas.
// Cuenta 1: SMTP_USER/SMTP_PASS. Cuenta 2: MAIL2_USER/MAIL2_PASS.

export type MailAccount = {
  id: string; // dirección de correo (identifica la cuenta)
  user: string;
  pass: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
};

export function mailAccounts(): MailAccount[] {
  const accs: MailAccount[] = [];
  const imapHost = process.env.IMAP_HOST || "imap.ionos.es";
  const imapPort = Number(process.env.IMAP_PORT || 993);
  const smtpHost = process.env.SMTP_HOST || "smtp.ionos.es";
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    accs.push({
      id: process.env.SMTP_USER,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
    });
  }
  if (process.env.MAIL2_USER && process.env.MAIL2_PASS) {
    accs.push({
      id: process.env.MAIL2_USER,
      user: process.env.MAIL2_USER,
      pass: process.env.MAIL2_PASS,
      imapHost: process.env.MAIL2_IMAP_HOST || imapHost,
      imapPort: Number(process.env.MAIL2_IMAP_PORT || imapPort),
      smtpHost: process.env.MAIL2_SMTP_HOST || smtpHost,
      smtpPort: Number(process.env.MAIL2_SMTP_PORT || smtpPort),
    });
  }
  return accs;
}

// Devuelve la cuenta cuyo id coincide (por dirección). Si no hay coincidencia y
// solo hay una cuenta, la devuelve (compatibilidad). Si no, null.
export function accountById(id: string | null | undefined): MailAccount | null {
  const accs = mailAccounts();
  if (id) {
    const hit = accs.find((a) => a.id.toLowerCase() === String(id).toLowerCase());
    if (hit) return hit;
  }
  return accs.length === 1 ? accs[0] : null;
}
