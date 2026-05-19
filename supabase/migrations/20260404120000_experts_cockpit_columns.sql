-- Cockpit expert : avatar dédié, bio, progression d'inscription
-- registration_step : entier 0–5 (5 = profil considéré comme complet pour la jauge)

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS registration_step integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.experts.avatar_url IS 'URL photo de profil expert (prioritaire sur photo_url côté app si renseignée)';
COMMENT ON COLUMN public.experts.registration_step IS 'Étape d''onboarding / complétion (0–5)';

UPDATE public.experts
SET avatar_url = photo_url
WHERE avatar_url IS NULL AND photo_url IS NOT NULL;
