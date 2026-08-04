-- Categoría para organizar la biblioteca de recursos.
ALTER TABLE public.resources ADD COLUMN category text NOT NULL DEFAULT 'Otros';
