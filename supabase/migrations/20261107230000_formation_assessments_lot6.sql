-- Lot 6 — Positionnement + évals à chaud / à froid + questionnaire entreprise

create table if not exists public.formation_assessment_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique
    check (kind in ('positionnement', 'eval_chaud', 'eval_froid', 'questionnaire_entreprise')),
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formation_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.formation_dossiers (id) on delete cascade,
  participant_id uuid references public.formation_participants (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  kind text not null
    check (kind in ('positionnement', 'eval_chaud', 'eval_froid', 'questionnaire_entreprise')),
  access_token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  answers jsonb not null default '{}'::jsonb,
  score_pct numeric(5, 2),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists formation_assessment_attempts_dossier_idx
  on public.formation_assessment_attempts (dossier_id, kind);

create unique index if not exists formation_assessment_attempts_active_uidx
  on public.formation_assessment_attempts (
    dossier_id,
    kind,
    (coalesce(participant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  )
  where status <> 'completed';

alter table public.formation_assessment_templates enable row level security;
alter table public.formation_assessment_attempts enable row level security;

drop policy if exists formation_assessment_templates_staff on public.formation_assessment_templates;
create policy formation_assessment_templates_staff on public.formation_assessment_templates
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists formation_assessment_attempts_staff on public.formation_assessment_attempts;
create policy formation_assessment_attempts_staff on public.formation_assessment_attempts
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

-- Gabarits par défaut (1 question / écran côté UI)
insert into public.formation_assessment_templates (kind, title, questions)
values
(
  'positionnement',
  'Test de positionnement',
  '[
    {"id":"p1","prompt":"Comment évaluez-vous votre niveau actuel sur le sujet de la formation ?","type":"scale","min":1,"max":5,"labels":["Débutant","Expert"]},
    {"id":"p2","prompt":"Avez-vous déjà pratiqué ces compétences en situation professionnelle ?","type":"single","options":["Jamais","Occasionnellement","Régulièrement","Quotidiennement"]},
    {"id":"p3","prompt":"Quel est votre principal objectif pour cette formation ?","type":"text"},
    {"id":"p4","prompt":"Souhaitez-vous un rythme plutôt…","type":"single","options":["Découverte","Approfondissement","Mise en pratique intensive"]}
  ]'::jsonb
),
(
  'eval_chaud',
  'Évaluation à chaud',
  '[
    {"id":"c1","prompt":"Globalement, cette formation a-t-elle répondu à vos attentes ?","type":"scale","min":1,"max":5,"labels":["Pas du tout","Tout à fait"]},
    {"id":"c2","prompt":"La pédagogie (rythme, exercices, échanges) était…","type":"scale","min":1,"max":5,"labels":["Insuffisante","Excellente"]},
    {"id":"c3","prompt":"Le formateur a-t-il facilité votre progression ?","type":"scale","min":1,"max":5,"labels":["Non","Oui clairement"]},
    {"id":"c4","prompt":"Recommanderiez-vous cette formation ?","type":"single","options":["Non","Peut-être","Oui"]},
    {"id":"c5","prompt":"Un commentaire libre (optionnel)","type":"text"}
  ]'::jsonb
),
(
  'eval_froid',
  'Évaluation à froid',
  '[
    {"id":"f1","prompt":"Deux mois plus tard, utilisez-vous les acquis de la formation ?","type":"scale","min":1,"max":5,"labels":["Pas du tout","Chaque jour"]},
    {"id":"f2","prompt":"Quel impact sur votre pratique professionnelle ?","type":"single","options":["Aucun","Faible","Moyen","Fort"]},
    {"id":"f3","prompt":"Quels freins reste-t-il ?","type":"text"},
    {"id":"f4","prompt":"Souhaitez-vous un rappel / atelier de suivi ?","type":"single","options":["Non","Oui"]}
  ]'::jsonb
),
(
  'questionnaire_entreprise',
  'Questionnaire entreprise',
  '[
    {"id":"e1","prompt":"La formation a-t-elle répondu au besoin exprimé ?","type":"scale","min":1,"max":5,"labels":["Non","Oui"]},
    {"id":"e2","prompt":"Observez-vous un transfert des acquis en situation de travail ?","type":"single","options":["Non observé","Partiel","Oui"]},
    {"id":"e3","prompt":"Organisation et communication Byound","type":"scale","min":1,"max":5,"labels":["Insuffisante","Excellente"]},
    {"id":"e4","prompt":"Commentaires / axes d''amélioration","type":"text"}
  ]'::jsonb
)
on conflict (kind) do nothing;
