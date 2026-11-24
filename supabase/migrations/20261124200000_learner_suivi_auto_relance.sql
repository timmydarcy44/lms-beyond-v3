-- Relance automatique LMS (par apprenant).
-- NULL / false = désactivé. Ne pas backfiller les comptes existants.
alter table public.profiles
  add column if not exists lms_auto_relance_enabled boolean;

comment on column public.profiles.lms_auto_relance_enabled is
  'Suivi LMS : relance auto (7j email, 14j appel). NULL/false = off. Activer uniquement pour les nouveaux inscrits ou manuellement.';

-- Enrichissement journal relances (statut / type) — colonnes optionnelles.
alter table public.learner_relances
  add column if not exists kind text,
  add column if not exists status text,
  add column if not exists scheduled_for timestamptz;

comment on column public.learner_relances.kind is 'email_auto | email_manuel | appel';
comment on column public.learner_relances.status is 'envoye | ouvert | a_venir | fait';
