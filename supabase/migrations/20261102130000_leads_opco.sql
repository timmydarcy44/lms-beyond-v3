-- Demandes « Financement OPCO ». Insertion uniquement via la route serveur (service role).
-- Lecture réservée aux admins. À coller dans le SQL editor Supabase.

create table if not exists public.leads_opco (
  id uuid primary key default gen_random_uuid(),
  siret text not null,
  effectif text not null check (effectif in ('moins-11', '11-49', '50-249', '250-plus')),
  formation_id text not null,
  email text not null,
  created_at timestamptz not null default now(),
  source text not null default 'financement-opco',
  is_test boolean not null default false
);

create index if not exists leads_opco_created_at_idx on public.leads_opco (created_at desc);

alter table public.leads_opco enable row level security;

revoke all on table public.leads_opco from anon, authenticated;
grant select on table public.leads_opco to authenticated;
grant select, insert, update, delete on table public.leads_opco to service_role;

drop policy if exists leads_opco_admin_select on public.leads_opco;
create policy leads_opco_admin_select
on public.leads_opco
for select
to authenticated
using (
  public.user_has_role(auth.uid(), array['super_admin', 'admin'])
  or exists (
    select 1 from public.super_admins sa
    where sa.user_id = auth.uid() and sa.is_active = true
  )
);
