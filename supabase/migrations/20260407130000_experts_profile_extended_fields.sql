-- Expert profile (cockpit) : champs affichés dans la fiche DRH / édition expert
-- Note: jsonb used for flexible UI fields while schema stabilizes.

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS open_badges jsonb;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS references jsonb;

COMMENT ON COLUMN public.experts.open_badges IS 'Liste de badges numériques (jsonb array)';
COMMENT ON COLUMN public.experts.references IS 'Liste de références (entreprise/projet) (jsonb array)';

