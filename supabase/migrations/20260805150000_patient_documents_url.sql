-- Permitir que un documento del paciente sea un ENLACE (URL) además de un
-- archivo subido: se añade columna url y file_path pasa a ser opcional.
ALTER TABLE public.patient_documents
  ADD COLUMN url text,
  ALTER COLUMN file_path DROP NOT NULL;
