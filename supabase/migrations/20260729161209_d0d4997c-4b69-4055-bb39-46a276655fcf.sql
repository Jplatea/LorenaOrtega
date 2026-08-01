ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS ingredients JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migrate existing text content into a single structured ingredient line.
UPDATE public.recipes
SET ingredients = jsonb_build_array(jsonb_build_object('name', content, 'amount', ''))
WHERE content IS NOT NULL AND content <> '' AND ingredients = '[]'::jsonb;
