-- Lot 7 — BPF (Bilan pédagogique et financier)

alter table public.of_settings
  add column if not exists bpf_campaign_deadline date,
  add column if not exists bpf_last_reminder_at timestamptz;

create table if not exists public.bpf_charge_entries (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_start date not null,
  fiscal_year_end date not null,
  kind text not null
    check (kind in ('total_charges', 'salaires_formateurs', 'achats_prestations_formation')),
  amount_ht_cents integer not null default 0,
  label text,
  source text not null default 'manual' check (source in ('manual', 'csv')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bpf_charge_entries_period_idx
  on public.bpf_charge_entries (fiscal_year_start, fiscal_year_end, kind);

create table if not exists public.bpf_snapshots (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_start date not null,
  fiscal_year_end date not null,
  payload jsonb not null default '{}'::jsonb,
  anomaly_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bpf_snapshots_period_idx
  on public.bpf_snapshots (fiscal_year_end desc);

alter table public.bpf_charge_entries enable row level security;
alter table public.bpf_snapshots enable row level security;

drop policy if exists bpf_charge_entries_staff on public.bpf_charge_entries;
create policy bpf_charge_entries_staff on public.bpf_charge_entries
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists bpf_snapshots_staff on public.bpf_snapshots;
create policy bpf_snapshots_staff on public.bpf_snapshots
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

comment on table public.bpf_charge_entries is 'Cadre D BPF — saisie manuelle / import CSV';
comment on table public.bpf_snapshots is 'Brouillons BPF sauvegardés (traçabilité)';
