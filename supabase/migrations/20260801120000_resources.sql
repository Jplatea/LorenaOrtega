-- Biblioteca general de recursos (archivos + enlaces) para el nutricionista.

CREATE TYPE public.resource_kind AS ENUM ('file', 'url');

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.resource_kind NOT NULL,
  title text NOT NULL,
  url text,                 -- para enlaces web (kind = 'url')
  file_path text,           -- ruta en Storage (kind = 'file')
  mime_type text,
  size_bytes bigint,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan recursos"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX resources_created_idx ON public.resources(created_at DESC);

-- Bucket privado para los archivos de recursos
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', false)
ON CONFLICT (id) DO NOTHING;

-- Solo admins gestionan/leen los archivos del bucket 'resources'
CREATE POLICY "Admins gestionan archivos de recursos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));
