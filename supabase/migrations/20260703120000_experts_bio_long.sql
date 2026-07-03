-- Présentation longue expert (profil type LinkedIn / Malt)

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS bio_long text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS daily_rate numeric;

COMMENT ON COLUMN public.experts.bio_long IS 'Approche pédagogique et présentation détaillée';
COMMENT ON COLUMN public.experts.website_url IS 'Site web ou portfolio public';
COMMENT ON COLUMN public.experts.daily_rate IS 'Tarif journalier indicatif (EUR)';
