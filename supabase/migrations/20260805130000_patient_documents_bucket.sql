-- Bucket privado para los documentos de cada paciente (el portal los descarga
-- con URL firmada). Las políticas de acceso ya existen en la migración inicial
-- de patient_documents; aquí solo creamos el bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;
