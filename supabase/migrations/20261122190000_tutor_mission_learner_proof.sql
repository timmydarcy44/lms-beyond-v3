-- Preuve de mission déposée par l'alternant (note + lien/fichier)
alter table public.tutor_missions
  add column if not exists learner_note text,
  add column if not exists proof_url text;

comment on column public.tutor_missions.learner_note is
  'Commentaire / description du travail fourni par l''alternant à la soumission.';
comment on column public.tutor_missions.proof_url is
  'Lien ou URL de fichier (preuve) fourni par l''alternant.';
