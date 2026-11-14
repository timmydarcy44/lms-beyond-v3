-- Qualiopi vue d'ensemble v2 — profil d'activités + audit + preuves manuelles
-- Additive only. Idempotent (relançable si partiellement appliqué).

-- ---------------------------------------------------------------------------
-- 1. Profil d'activités + prochain audit (of_settings)
-- ---------------------------------------------------------------------------
alter table public.of_settings
  add column if not exists qualiopi_activities jsonb not null default '{"of":true,"cfa":true,"vae":false,"bilan":false,"certifying":false,"pfst":false}'::jsonb;

alter table public.of_settings
  add column if not exists qualiopi_audit_type text;

update public.of_settings
set qualiopi_audit_type = 'surveillance'
where qualiopi_audit_type is null;

alter table public.of_settings
  alter column qualiopi_audit_type set default 'surveillance';

alter table public.of_settings
  alter column qualiopi_audit_type set not null;

alter table public.of_settings
  drop constraint if exists of_settings_qualiopi_audit_type_check;

alter table public.of_settings
  add constraint of_settings_qualiopi_audit_type_check
  check (qualiopi_audit_type in ('initial', 'surveillance', 'renouvellement'));

alter table public.of_settings
  add column if not exists qualiopi_audit_at date;

comment on column public.of_settings.qualiopi_activities is
  'Profil d''activités Qualiopi : of, cfa, vae, bilan, certifying, pfst (booléens).';
comment on column public.of_settings.qualiopi_audit_type is
  'Type du prochain audit Qualiopi (initial / surveillance / renouvellement).';
comment on column public.of_settings.qualiopi_audit_at is
  'Date du prochain audit Qualiopi.';

-- ---------------------------------------------------------------------------
-- 2. Preuves manuelles par indicateur (1–32)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_qualiopi_indicator_proofs (
  id uuid primary key default gen_random_uuid(),
  indicator_id int not null check (indicator_id >= 1 and indicator_id <= 32),
  label text not null,
  comment text,
  file_url text,
  file_name text,
  storage_bucket text,
  storage_path text,
  proof_at date not null default current_date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_indicator_proofs_ind_idx
  on public.crm_qualiopi_indicator_proofs (indicator_id, proof_at desc);

alter table public.crm_qualiopi_indicator_proofs enable row level security;

drop policy if exists crm_qualiopi_indicator_proofs_super on public.crm_qualiopi_indicator_proofs;
create policy crm_qualiopi_indicator_proofs_super on public.crm_qualiopi_indicator_proofs
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

comment on table public.crm_qualiopi_indicator_proofs is
  'Preuves manuelles Qualiopi (document + date + commentaire) par indicateur 1–32.';

-- ---------------------------------------------------------------------------
-- 3. Attestations : supprimer le 33 (Lot 6), puis contrainte 1–32
--    Ordre critique : DELETE avant ADD CONSTRAINT
-- ---------------------------------------------------------------------------
alter table public.crm_qualiopi_indicator_attestations
  drop constraint if exists crm_qualiopi_indicator_attestations_indicator_id_check;

delete from public.crm_qualiopi_indicator_attestations
where indicator_id < 1 or indicator_id > 32;

alter table public.crm_qualiopi_indicator_attestations
  add constraint crm_qualiopi_indicator_attestations_indicator_id_check
  check (indicator_id >= 1 and indicator_id <= 32);

-- kind (evidence | na) si absent (Lot 6)
alter table public.crm_qualiopi_indicator_attestations
  add column if not exists kind text;

update public.crm_qualiopi_indicator_attestations
set kind = 'evidence'
where kind is null;

alter table public.crm_qualiopi_indicator_attestations
  alter column kind set default 'evidence';

alter table public.crm_qualiopi_indicator_attestations
  alter column kind set not null;

alter table public.crm_qualiopi_indicator_attestations
  drop constraint if exists crm_qualiopi_indicator_attestations_kind_check;

alter table public.crm_qualiopi_indicator_attestations
  add constraint crm_qualiopi_indicator_attestations_kind_check
  check (kind in ('evidence', 'na'));

comment on column public.crm_qualiopi_indicator_attestations.kind is
  'evidence = preuve manuelle validante ; na = justification N/A (exportable).';

comment on table public.crm_qualiopi_indicator_attestations is
  'Qualiopi — attestations manuelles (1–32) et justifications N/A.';
