
-- Category enum
CREATE TYPE public.document_category AS ENUM ('diet','recipe','guide','analysis','other');

CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  category public.document_category NOT NULL DEFAULT 'other',
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX patient_documents_patient_idx ON public.patient_documents(patient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_documents TO authenticated;
GRANT ALL ON public.patient_documents TO service_role;

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan documentos" ON public.patient_documents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Paciente ve sus documentos" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

CREATE TRIGGER patient_documents_set_updated_at
  BEFORE UPDATE ON public.patient_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies: files stored under `<patient_id>/<uuid>-<filename>`
CREATE POLICY "Admins gestionan archivos de pacientes" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'patient-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'patient-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Paciente lee sus archivos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
