create table if not exists public.training_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid,
  skill_id text,
  label text not null,
  message text,
  urgency text not null default 'normale',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint training_requests_urgency_check check (urgency in ('basse', 'normale')),
  constraint training_requests_status_check check (status in ('new', 'seen', 'accepted', 'declined'))
);

create index if not exists training_requests_user_idx on public.training_requests (user_id, created_at desc);
create index if not exists training_requests_company_idx on public.training_requests (company_id, created_at desc);

alter table public.training_requests enable row level security;

drop policy if exists training_requests_own_select on public.training_requests;
create policy training_requests_own_select
  on public.training_requests
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists training_requests_own_insert on public.training_requests;
create policy training_requests_own_insert
  on public.training_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists training_requests_hr_select on public.training_requests;
create policy training_requests_hr_select
  on public.training_requests
  for select
  to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.company_id = training_requests.company_id
        and (
          lower(coalesce(p.role, '')) in ('entreprise', 'rh', 'admin', 'admin_hr', 'company', 'manager', 'gerant')
          or lower(coalesce(p.role_type, '')) in ('entreprise', 'rh', 'admin', 'admin_hr', 'company', 'manager', 'gerant')
        )
    )
  );
