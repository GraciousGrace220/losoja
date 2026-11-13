-- LosOja business pretty URLs
-- Run this once in Supabase SQL Editor before enabling slug-based shop lookups.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS slug text;

-- Convert business names to URL-safe slugs and make collisions deterministic.
WITH normalised AS (
  SELECT id,
         trim(both '-' from regexp_replace(
           regexp_replace(lower(coalesce(name, 'business')), '[^a-z0-9]+', '-', 'g'),
           '(^-+|-+$)', '', 'g'
         )) AS base_slug
  FROM public.businesses
), numbered AS (
  SELECT id, base_slug,
         row_number() OVER (PARTITION BY base_slug ORDER BY id) AS duplicate_number
  FROM normalised
)
UPDATE public.businesses AS b
SET slug = CASE
  WHEN n.base_slug = '' THEN 'business-' || left(b.id::text, 8)
  WHEN n.duplicate_number = 1 THEN n.base_slug
  ELSE n.base_slug || '-' || n.duplicate_number
END
FROM numbered AS n
WHERE b.id = n.id
  AND (b.slug IS NULL OR b.slug = '');

-- Ensure the requested Hair by Bidex slug, without ever assigning it to another business.
DO $$
DECLARE
  bidex_id uuid;
BEGIN
  SELECT id INTO bidex_id
  FROM public.businesses
  WHERE lower(trim(name)) = 'hair by bidex'
  ORDER BY created_at NULLS LAST
  LIMIT 1;

  IF bidex_id IS NOT NULL THEN
    UPDATE public.businesses
    SET slug = 'hair-by-bidex'
    WHERE id = bidex_id;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_unique_idx
  ON public.businesses (slug);

CREATE OR REPLACE FUNCTION public.losoja_set_business_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix integer := 2;
BEGIN
  base_slug := trim(both '-' from regexp_replace(
    regexp_replace(lower(coalesce(NEW.name, 'business')), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  ));
  IF base_slug = '' THEN
    base_slug := 'business';
  END IF;

  candidate := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.slug = candidate
      AND (TG_OP = 'INSERT' OR b.id <> NEW.id)
  ) LOOP
    candidate := base_slug || '-' || suffix;
    suffix := suffix + 1;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS losoja_business_slug_trigger ON public.businesses;
CREATE TRIGGER losoja_business_slug_trigger
BEFORE INSERT OR UPDATE OF name ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.losoja_set_business_slug();

-- Confirm slugs and the Hair by Bidex record.
SELECT id, name, slug
FROM public.businesses
WHERE lower(trim(name)) = 'hair by bidex'
   OR slug IS NULL
ORDER BY name;
