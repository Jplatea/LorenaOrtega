-- Base de PRODUCTOS: alimentos genéricos (BEDCA) + productos de marca (Open Food
-- Facts, con Nutri-Score). Sirven de bloques para componer recetas.
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'producto',            -- 'alimento' (genérico) | 'producto' (marca)
  name text NOT NULL,
  brand text,
  barcode text,                                      -- código OFF (si aplica)
  image_url text,
  category text,
  -- Valores nutricionales por 100 g
  kcal numeric, prot numeric, fat numeric, carb numeric, fiber numeric,
  sat_fat numeric, sugars numeric, salt numeric,
  nutri_score text,                                  -- 'a'..'e' (solo marca)
  source text NOT NULL DEFAULT 'manual',             -- 'bedca' | 'openfoodfacts' | 'manual'
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_kind_idx ON public.products (kind);
CREATE INDEX IF NOT EXISTS products_name_idx ON public.products (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_uidx ON public.products (barcode) WHERE barcode IS NOT NULL;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona productos" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Autenticados leen productos" ON public.products
  FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
