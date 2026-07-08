-- Pivot Mission EDGE : enrichir edge_challenge_runs avec le brief scénarisé.
-- (Le nom technique de la table reste edge_challenge_runs pour compatibilité.)

alter table public.edge_challenge_runs
  add column if not exists mission_title text,
  add column if not exists mission_brief jsonb,
  add column if not exists why_selected text[] not null default '{}',
  add column if not exists debrief_extended jsonb;

comment on column public.edge_challenge_runs.mission_brief is
  'Brief Mission EDGE : contexte, personnages, objectif pédagogique, critères de réussite.';
comment on column public.edge_challenge_runs.debrief_extended is
  'Débrief enrichi : observations, exemples cités, mission recommandée.';
