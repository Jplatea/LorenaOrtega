-- El paciente puede ver sus propias mediciones (portal del paciente).
CREATE POLICY "Paciente ve sus mediciones"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());
