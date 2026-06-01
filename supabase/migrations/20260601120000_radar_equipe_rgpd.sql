-- Radar Équipe : agrégats anonymisés, micro check-ins, consentements partage
-- Couche nominative : collaborateur_diagnostics (collaborateur uniquement)
-- Couche manager/RH : equipe_aggregats (jamais de noms)

create table if not exists public.equipes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  name text not null default 'Équipe principale',
  manager_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipes_organisation_idx on public.equipes (organisation_id);

-- Diagnostics nominatifs (couche 1)
create table if not exists public.collaborateur_diagnostics (
  id uuid primary key default gen_random_uuid(),
  collaborateur_id uuid not null references public.profiles (id) on delete cascade,
  equipe_id uuid not null references public.equipes (id) on delete cascade,
  organisation_id uuid not null,
  employee_id uuid,
  idmc_score numeric(5, 1),
  stress_score numeric(5, 1),
  disc_profil text check (disc_profil in ('D', 'I', 'S', 'C')),
  soft_skills_gaps text[] default '{}',
  actif boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collaborateur_id)
);

create index if not exists collaborateur_diagnostics_equipe_idx
  on public.collaborateur_diagnostics (equipe_id, actif);

-- Agrégats équipe (couche 2 — anonymisée)
create table if not exists public.equipe_aggregats (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references public.equipes (id) on delete cascade,
  organisation_id uuid not null,
  periode_debut date not null,
  periode_fin date not null,
  nb_membres_actifs integer not null,
  nb_diagnostics_completes integer not null,
  idmc_moyen numeric(4, 1),
  idmc_zone text check (idmc_zone in ('optimal', 'attention', 'rupture')),
  stress_moyen numeric(4, 1),
  stress_signal text check (stress_signal in ('faible', 'modere', 'eleve', 'critique')),
  disc_d_pct integer,
  disc_i_pct integer,
  disc_s_pct integer,
  disc_c_pct integer,
  taux_completion_moyen numeric(4, 1),
  nb_abandons_semaine integer default 0,
  connexions_hors_horaires integer default 0,
  gaps_competences text[] default '{}',
  modules_recommandes text[] default '{}',
  nb_signaux_attention integer default 0,
  nb_signaux_critique integer default 0,
  insight_principal text,
  cohesion_score integer,
  profil_manquant text,
  insuffisant boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipe_aggregats_equipe_periode_idx
  on public.equipe_aggregats (equipe_id, periode_debut desc);

-- Consentement partage volontaire fiche complète
create table if not exists public.collaborateur_partages (
  id uuid primary key default gen_random_uuid(),
  collaborateur_id uuid not null references public.profiles (id) on delete cascade,
  manager_id uuid not null references public.profiles (id) on delete cascade,
  consentement_donne boolean not null default false,
  consentement_date timestamptz,
  revocation_date timestamptz,
  created_at timestamptz not null default now(),
  unique (collaborateur_id, manager_id)
);

create index if not exists collaborateur_partages_collab_idx
  on public.collaborateur_partages (collaborateur_id, manager_id);

-- Micro check-in hebdomadaire (nominatif côté collaborateur uniquement)
create table if not exists public.micro_checkins (
  id uuid primary key default gen_random_uuid(),
  collaborateur_id uuid not null references public.profiles (id) on delete cascade,
  equipe_id uuid not null references public.equipes (id) on delete cascade,
  semaine_iso text not null,
  question_id text not null,
  dimension text not null,
  score integer not null check (score between 1 and 4),
  created_at timestamptz not null default now(),
  unique (collaborateur_id, semaine_iso, question_id)
);

create index if not exists micro_checkins_equipe_semaine_idx
  on public.micro_checkins (equipe_id, semaine_iso);

-- Lien optionnel employees → équipe
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'employees'
  ) then
    alter table public.employees add column if not exists equipe_id uuid references public.equipes (id) on delete set null;
    alter table public.employees add column if not exists profile_id uuid references public.profiles (id) on delete set null;
  end if;
end $$;

-- RLS
alter table public.equipes enable row level security;
alter table public.collaborateur_diagnostics enable row level security;
alter table public.equipe_aggregats enable row level security;
alter table public.collaborateur_partages enable row level security;
alter table public.micro_checkins enable row level security;

-- Helper : même organisation entreprise
create or replace function public.radar_same_organisation(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.company_id is not null
      and p.company_id = p_org
      and (
        coalesce(p.role, '') in ('entreprise', 'admin_hr', 'admin', 'rh')
        or coalesce(p.role_type, '') in ('entreprise', 'admin_hr')
      )
  );
$$;

-- équipes : manager/RH de l'org
drop policy if exists equipes_select_org on public.equipes;
create policy equipes_select_org on public.equipes
  for select using (public.radar_same_organisation(organisation_id));

drop policy if exists equipes_manage_org on public.equipes;
create policy equipes_manage_org on public.equipes
  for all using (public.radar_same_organisation(organisation_id));

-- diagnostics : uniquement le collaborateur (ses propres lignes)
drop policy if exists collaborateur_diagnostics_own on public.collaborateur_diagnostics;
create policy collaborateur_diagnostics_own on public.collaborateur_diagnostics
  for all using (collaborateur_id = auth.uid())
  with check (collaborateur_id = auth.uid());

-- agrégats : manager/RH org — jamais les données brutes individuelles
drop policy if exists equipe_aggregats_select_org on public.equipe_aggregats;
create policy equipe_aggregats_select_org on public.equipe_aggregats
  for select using (public.radar_same_organisation(organisation_id));

-- partages : collaborateur gère son consentement
drop policy if exists collaborateur_partages_own on public.collaborateur_partages;
create policy collaborateur_partages_own on public.collaborateur_partages
  for all using (collaborateur_id = auth.uid())
  with check (collaborateur_id = auth.uid());

-- micro check-ins : collaborateur uniquement
drop policy if exists micro_checkins_own on public.micro_checkins;
create policy micro_checkins_own on public.micro_checkins
  for all using (collaborateur_id = auth.uid())
  with check (collaborateur_id = auth.uid());

grant select on public.equipes to authenticated;
grant select on public.equipe_aggregats to authenticated;
grant all on public.collaborateur_diagnostics to authenticated;
grant all on public.collaborateur_partages to authenticated;
grant all on public.micro_checkins to authenticated;
