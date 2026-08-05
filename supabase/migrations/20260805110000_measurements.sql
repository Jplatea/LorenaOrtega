-- Seguimiento de progreso del paciente (peso y medidas en el tiempo).
CREATE TABLE public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  weight numeric,      -- peso (kg)
  body_fat numeric,    -- % grasa
  waist numeric,       -- cintura (cm)
  hip numeric,         -- cadera (cm)
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurements TO authenticated;
GRANT ALL ON public.measurements TO service_role;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan mediciones"
  ON public.measurements FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX measurements_patient_date_idx ON public.measurements(patient_id, date);
