-- Imagen opcional por receta (para la paleta visual de dietas y el recetario).
ALTER TABLE public.recipes ADD COLUMN image_path text;

-- Bucket PÚBLICO para las fotos de recetas (no son datos sensibles; se muestran
-- en la paleta y potencialmente al paciente). El acceso de lectura es por URL
-- pública; escribir/borrar solo administradores.
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins suben imágenes de recetas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins actualizan imágenes de recetas"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'recipe-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'recipe-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins borran imágenes de recetas"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'recipe-images' AND public.has_role(auth.uid(), 'admin'));
