-- Statut de validation expert + champs inscription EDGE

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS review_status text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS wants_certification boolean NOT NULL DEFAULT false;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS regions text[];
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.experts
SET review_status = 'approved'
WHERE review_status IS NULL AND is_active = true;

UPDATE public.experts
SET review_status = 'pending_review'
WHERE review_status IS NULL;

UPDATE public.experts
SET is_active = false
WHERE review_status = 'pending_review' AND is_active IS NULL;

ALTER TABLE public.experts ALTER COLUMN review_status SET DEFAULT 'pending_review';

COMMENT ON COLUMN public.experts.review_status IS 'pending_review | approved | rejected | needs_info';
COMMENT ON COLUMN public.experts.wants_certification IS 'Souhaite suivre le parcours certification EDGE';
COMMENT ON COLUMN public.experts.photo_url IS 'URL photo de profil (alias historique, voir aussi avatar_url)';
