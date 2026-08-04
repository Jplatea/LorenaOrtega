-- Solicitudes de contacto / reserva de consulta desde la landing pública.

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  phone text,
  message text,
  source text NOT NULL DEFAULT 'landing',   -- 'hero' | 'contacto' | ...
  handled boolean NOT NULL DEFAULT false,    -- marcado por la nutricionista
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Cualquiera (visitante anónimo) puede ENVIAR una solicitud, nada más.
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

CREATE POLICY "Cualquiera puede enviar una solicitud"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins gestionan las solicitudes"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins actualizan las solicitudes"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins borran las solicitudes"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX leads_created_idx ON public.leads(created_at DESC);
