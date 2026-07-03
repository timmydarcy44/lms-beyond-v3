-- Inscription expert EDGE : statut de revue, certification, LinkedIn, activation, photo.
-- Idempotent.

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS review_status text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS wants_certification boolean NOT NULL DEFAULT false;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS regions text[];
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.experts
SET avatar_url = photo_url
WHERE avatar_url IS NULL AND photo_url IS NOT NULL;

UPDATE public.experts
SET review_status = 'approved'
WHERE review_status IS NULL AND coalesce(is_active, true) = true;

UPDATE public.experts
SET review_status = 'pending_review'
WHERE review_status IS NULL;

ALTER TABLE public.experts ALTER COLUMN review_status SET DEFAULT 'pending_review';

COMMENT ON COLUMN public.experts.review_status IS 'pending_review | approved | rejected | needs_info';
COMMENT ON COLUMN public.experts.wants_certification IS 'Souhaite suivre le parcours certification EDGE';
COMMENT ON COLUMN public.experts.photo_url IS 'URL photo de profil (alias historique, voir aussi avatar_url)';
