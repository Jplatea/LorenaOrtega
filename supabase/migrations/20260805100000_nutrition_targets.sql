-- Objetivos nutricionales por paciente (para comparar el plan con la meta).
ALTER TABLE public.profiles
  ADD COLUMN target_kcal integer,
  ADD COLUMN target_prot numeric,
  ADD COLUMN target_fat numeric,
  ADD COLUMN target_carb numeric;
