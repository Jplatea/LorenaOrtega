-- El paciente puede registrar y borrar sus propias mediciones de peso desde su
-- portal (además de la lectura que ya tenía). El admin sigue gestionándolas todas.
CREATE POLICY "Paciente registra sus mediciones"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Paciente borra sus mediciones"
  ON public.measurements FOR DELETE
  TO authenticated
  USING (patient_id = auth.uid());
