-- Valores nutricionales introducidos a mano en la receta (por 100 g). Si están
-- presentes, se muestran en las tarjetas en vez de los calculados con BEDCA.
ALTER TABLE public.recipes
  ADD COLUMN kcal numeric,
  ADD COLUMN prot numeric,
  ADD COLUMN fat numeric,
  ADD COLUMN carb numeric;
