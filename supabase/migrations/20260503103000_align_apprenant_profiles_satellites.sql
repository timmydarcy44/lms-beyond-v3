-- Alignement BDD ↔ dashboard apprenant + colonnes étendues profiles.
-- Tables : disc_resultats, idmc_resultats, experiences_pro, diplomes, soft_skills_resultats,
--          user_profile_settings
-- (distinct de soft_skills_resultats_salarie — usage salarié / autre flux)
--
-- Prérequis : public.profiles, extension pgcrypto.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Colonnes profiles utilisées par les écrans apprenant / école (ajout idempotent)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    alter table public.profiles add column if not exists school_id uuid;
    alter table public.profiles add column if not exists company_id uuid;
    alter table public.profiles add column if not exists entreprise_id uuid;
    alter table public.profiles add column if not exists contract_type text;
    alter table public.profiles add column if not exists role_type text;
    alter table public.profiles add column if not exists school_class text;
    alter table public.profiles add column if not exists birth_date text;
    alter table public.profiles add column if not exists date_naissance text;
    alter table public.profiles add column if not exists city text;
    alter table public.profiles add column if not exists telephone text;
    alter table public.profiles add column if not exists phone_number text;
    alter table public.profiles add column if not exists poste_actuel text;
    alter table public.profiles add column if not exists entreprise text;
    alter table public.profiles add column if not exists type_contrat text;
    alter table public.profiles add column if not exists tjm text;
    alter table public.profiles add column if not exists expertise text;
    alter table public.profiles add column if not exists stack_technique text;
    alter table public.profiles add column if not exists disponibilite boolean;
    alter table public.profiles add column if not exists langues text;
    alter table public.profiles add column if not exists ancien_metier text;
    alter table public.profiles add column if not exists metier_vise text;
    alter table public.profiles add column if not exists organisme_formation text;
    alter table public.profiles add column if not exists echeance text;
    alter table public.profiles add column if not exists ecole text;
    alter table public.profiles add column if not exists niveau_etude text;
    alter table public.profiles add column if not exists rythme_alternance text;
    alter table public.profiles add column if not exists date_fin_contrat text;
    alter table public.profiles add column if not exists skills_metadata jsonb;
    alter table public.profiles add column if not exists hard_skills jsonb;
    alter table public.profiles add column if not exists ai_analysis text;
    alter table public.profiles add column if not exists experience jsonb;
    alter table public.profiles add column if not exists education jsonb;
    alter table public.profiles add column if not exists age text;
    alter table public.profiles add column if not exists bio text;
    alter table public.profiles add column if not exists anciennete_freelance text;
    alter table public.profiles add column if not exists updated_at timestamptz;
  end if;
end $$;

create index if not exists profiles_school_id_idx on public.profiles (school_id);
create index if not exists profiles_company_id_idx on public.profiles (company_id);
create index if not exists profiles_role_type_idx on public.profiles (role_type);

-- ---------------------------------------------------------------------------
-- Tests & résultats apprenant (archiver tout schéma sans profile_id / user_id PK métier)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.disc_resultats') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'disc_resultats'
        and column_name = 'profile_id'
    ) then
      drop table if exists public.disc_resultats_legacy_pre_20260503 cascade;
      alter table public.disc_resultats rename to disc_resultats_legacy_pre_20260503;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.idmc_resultats') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'idmc_resultats'
        and column_name = 'profile_id'
    ) then
      drop table if exists public.idmc_resultats_legacy_pre_20260503 cascade;
      alter table public.idmc_resultats rename to idmc_resultats_legacy_pre_20260503;
    end if;
  end if;
end $$;

create table if not exists public.disc_resultats (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  responses jsonb,
  scores jsonb,
  final_profile text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idmc_resultats (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  scores jsonb,
  responses jsonb,
  global_score numeric,
  level text,
  updated_at timestamptz not null default now()
);

-- Ancienne table sans learner_id (schéma incompatible avec le front) → renommée, puis table attendue.
do $$
begin
  if to_regclass('public.soft_skills_resultats') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'soft_skills_resultats'
        and column_name = 'learner_id'
    ) then
      drop table if exists public.soft_skills_resultats_legacy_pre_20260503 cascade;
      alter table public.soft_skills_resultats rename to soft_skills_resultats_legacy_pre_20260503;
    end if;
  end if;
end $$;

create table if not exists public.soft_skills_resultats (
  learner_id uuid primary key references public.profiles (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  total_score integer not null default 0,
  taken_at timestamptz not null default now()
);

-- Même problème si une ancienne table existe sans learner_id : CREATE IF NOT EXISTS est ignoré.
do $$
begin
  if to_regclass('public.experiences_pro') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'experiences_pro'
        and column_name = 'learner_id'
    ) then
      drop table if exists public.experiences_pro_legacy_pre_20260503 cascade;
      alter table public.experiences_pro rename to experiences_pro_legacy_pre_20260503;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.diplomes') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'diplomes'
        and column_name = 'learner_id'
    ) then
      drop table if exists public.diplomes_legacy_pre_20260503 cascade;
      alter table public.diplomes rename to diplomes_legacy_pre_20260503;
    end if;
  end if;
end $$;

-- user_profile_settings : ancienne table sans user_id
do $$
begin
  if to_regclass('public.user_profile_settings') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user_profile_settings'
        and column_name = 'user_id'
    ) then
      drop table if exists public.user_profile_settings_legacy_pre_20260503 cascade;
      alter table public.user_profile_settings rename to user_profile_settings_legacy_pre_20260503;
    end if;
  end if;
end $$;

create table if not exists public.experiences_pro (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  employeur text,
  type_contrat text,
  date_debut date,
  date_fin date,
  missions text,
  created_at timestamptz not null default now()
);

create index if not exists experiences_pro_learner_id_idx on public.experiences_pro (learner_id);

create table if not exists public.diplomes (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  intitule text,
  ecole text,
  annee_obtention integer,
  mode text,
  created_at timestamptz not null default now()
);

create index if not exists diplomes_learner_id_idx on public.diplomes (learner_id);

create table if not exists public.user_profile_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  public_slug text,
  has_paid_soft_skills boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_profile_settings_public_slug_idx
  on public.user_profile_settings (public_slug)
  where public_slug is not null and btrim(public_slug) <> '';

-- ---------------------------------------------------------------------------
-- RLS — propriétaire du profil
-- ---------------------------------------------------------------------------
alter table public.disc_resultats enable row level security;
alter table public.idmc_resultats enable row level security;
alter table public.soft_skills_resultats enable row level security;
alter table public.experiences_pro enable row level security;
alter table public.diplomes enable row level security;
alter table public.user_profile_settings enable row level security;

drop policy if exists "disc_resultats_own" on public.disc_resultats;
create policy "disc_resultats_own"
  on public.disc_resultats
  for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "idmc_resultats_own" on public.idmc_resultats;
create policy "idmc_resultats_own"
  on public.idmc_resultats
  for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "soft_skills_resultats_own" on public.soft_skills_resultats;
create policy "soft_skills_resultats_own"
  on public.soft_skills_resultats
  for all
  using (learner_id = auth.uid())
  with check (learner_id = auth.uid());

drop policy if exists "experiences_pro_own" on public.experiences_pro;
create policy "experiences_pro_own"
  on public.experiences_pro
  for all
  using (learner_id = auth.uid())
  with check (learner_id = auth.uid());

drop policy if exists "diplomes_own" on public.diplomes;
create policy "diplomes_own"
  on public.diplomes
  for all
  using (learner_id = auth.uid())
  with check (learner_id = auth.uid());

drop policy if exists "user_profile_settings_own" on public.user_profile_settings;
create policy "user_profile_settings_own"
  on public.user_profile_settings
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
