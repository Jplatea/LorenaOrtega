-- Bandeja de correo de Lorena dentro de la web. Guardamos en Supabase los
-- correos leídos por IMAP del buzón de IONOS (hola@lorenaortega.es) para poder
-- listarlos, buscarlos y vincularlos a cada cliente sin depender de terceros.
-- El envío sigue saliendo por SMTP (ver src/lib/email.functions.ts).
CREATE TABLE IF NOT EXISTS public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder text NOT NULL DEFAULT 'INBOX',              -- 'INBOX' | 'Sent'
  uid integer NOT NULL,                              -- UID IMAP dentro de la carpeta
  direction text NOT NULL DEFAULT 'in',              -- 'in' (recibido) | 'out' (enviado)
  message_id text,
  in_reply_to text,
  thread_key text,                                   -- clave para agrupar hilos (asunto normalizado)
  from_name text,
  from_addr text,
  to_addrs text[] NOT NULL DEFAULT '{}',
  cc_addrs text[] NOT NULL DEFAULT '{}',
  subject text NOT NULL DEFAULT '',
  date timestamptz,
  preview text,                                      -- primeras líneas en texto plano
  body_text text,
  body_html text,
  has_attachments boolean NOT NULL DEFAULT false,
  seen boolean NOT NULL DEFAULT false,
  answered boolean NOT NULL DEFAULT false,
  client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,  -- cliente vinculado
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Un correo = (carpeta, uid). Permite upsert idempotente al re-sincronizar.
CREATE UNIQUE INDEX IF NOT EXISTS emails_folder_uid_uidx ON public.emails (folder, uid);
CREATE INDEX IF NOT EXISTS emails_date_idx ON public.emails (date DESC);
CREATE INDEX IF NOT EXISTS emails_client_idx ON public.emails (client_id);
CREATE INDEX IF NOT EXISTS emails_from_idx ON public.emails (lower(from_addr));
CREATE INDEX IF NOT EXISTS emails_thread_idx ON public.emails (thread_key);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Solo la administradora (Lorena) ve y gestiona su bandeja.
CREATE POLICY "Admin gestiona correos" ON public.emails
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER emails_set_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
