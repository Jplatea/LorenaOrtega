-- Registro del resultado de cada sincronización de correo (para diagnóstico).
-- Guarda el JSON devuelto por syncInbox: por cuenta, si conectó, errores, etc.
CREATE TABLE IF NOT EXISTS public.mail_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  result jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.mail_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona log de correo" ON public.mail_sync_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
