-- Candidature et diffusion. Null = pas encore initialisé par l'éditeur.
-- Un tableau vide est un choix explicite (toutes les étapes retirées).

alter table public.job_offers
  add column if not exists recruitment_steps jsonb,
  add column if not exists requested_documents jsonb,
  add column if not exists screening_questions jsonb,
  add column if not exists application_deadline date,
  add column if not exists diffusion jsonb;
