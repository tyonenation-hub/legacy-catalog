-- Ejecutar UNA vez en Supabase SQL Editor antes de agregar productos de nuevos colores.
ALTER TABLE public.catalog_products DROP CONSTRAINT IF EXISTS catalog_products_color_slug_check;
ALTER TABLE public.catalog_products ADD CONSTRAINT catalog_products_color_slug_check CHECK (color_slug IN ('negro','blanco','arena','verde-militar','rojo','azul-electrico'));
