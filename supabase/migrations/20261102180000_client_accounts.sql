-- Comptes clients Byound Control.
-- Règles de remplissage validées le 2 novembre 2026.
-- Ne supprime ni ne fusionne aucune organisation.

alter table public.organizations
  add column if not exists status text,
  add column if not exists kind text,
  add column if not exists account_manager_id uuid references public.profiles (id) on delete set null,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists client_since date;

alter table public.super_admins
  add column if not exists is_test boolean not null default false;

update public.organizations
set
  kind = case
    when slug in (
      'edge-business-demo',
      'edge-demo-rh-aw78',
      'entreprise-de-test-yw9p',
      'lalaland-s3eb',
      'test03-xapi',
      'timdada'
    ) then 'demo'
    when slug in (
      'byound-5gfu',
      'edge-lab',
      'jessicacontentin',
      'playmakers',
      'byound-care-sekx',
      'byound-care-j7iu'
    ) then 'internal'
    else 'client'
  end,
  status = case
    when slug = 'byound-5gfu' then 'active'
    when slug in (
      'edge-business-demo',
      'edge-demo-rh-aw78',
      'entreprise-de-test-yw9p',
      'lalaland-s3eb',
      'test03-xapi',
      'timdada'
    ) then 'demo'
    else 'onboarding'
  end,
  client_since = case
    when slug = 'byound-5gfu' then created_at::date
    else client_since
  end
where status is null
   or kind is null;

alter table public.organizations alter column status set default 'onboarding';
alter table public.organizations alter column kind set default 'client';

alter table public.organizations drop constraint if exists organizations_status_check;
alter table public.organizations
  add constraint organizations_status_check
  check (status is null or status in ('active', 'trial', 'onboarding', 'demo', 'archived'));

alter table public.organizations drop constraint if exists organizations_kind_check;
alter table public.organizations
  add constraint organizations_kind_check
  check (kind is null or kind in ('client', 'internal', 'demo'));

create index if not exists organizations_status_idx on public.organizations (status);
create index if not exists organizations_kind_idx on public.organizations (kind);
create index if not exists organizations_account_manager_idx on public.organizations (account_manager_id);

create table if not exists public.org_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists org_notes_org_idx on public.org_notes (org_id, updated_at desc);

create table if not exists public.impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references public.profiles (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  mode text not null default 'read' check (mode in ('read', 'write')),
  reason_code text,
  reason_text text,
  notify_admin boolean not null default true,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  write_expires_at timestamptz,
  ended_at timestamptz,
  ip text,
  user_agent text
);

create index if not exists impersonation_sessions_staff_idx
  on public.impersonation_sessions (staff_user_id, started_at desc);
create index if not exists impersonation_sessions_org_idx
  on public.impersonation_sessions (org_id, started_at desc);

create table if not exists public.org_activity (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_type text not null check (actor_type in ('client', 'byound_on_behalf', 'system')),
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  impersonation_session_id uuid references public.impersonation_sessions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists org_activity_org_created_idx
  on public.org_activity (org_id, created_at desc);
create index if not exists org_activity_session_idx
  on public.org_activity (impersonation_session_id)
  where impersonation_session_id is not null;

-- Factures clients. Vide au départ : aucune facture n'existait par organisation.
-- sale_type proposé à l'audit : formation, plateforme, open_badges, tests.
create table if not exists public.org_billing_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  doc_type text not null check (doc_type in ('invoice', 'quote', 'credit_note')),
  number text,
  status text not null default 'issued'
    check (status in ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  amount_ht_cents integer not null default 0,
  amount_ttc_cents integer,
  sale_type text check (sale_type is null or sale_type in ('formation', 'plateforme', 'open_badges', 'tests')),
  opco_ht_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists org_billing_documents_org_issued_idx
  on public.org_billing_documents (org_id, issued_at desc);
create index if not exists org_billing_documents_due_idx
  on public.org_billing_documents (org_id, due_at);
create index if not exists org_billing_documents_paid_idx
  on public.org_billing_documents (org_id, paid_at);

create or replace function public.is_byound_staff(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.super_admins sa
    where sa.user_id = p_uid
      and coalesce(sa.is_active, true) = true
  );
$$;

create or replace function public.staff_impersonation_active(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.impersonation_sessions s
    where s.staff_user_id = p_uid
      and s.ended_at is null
      and s.expires_at > now()
  );
$$;

revoke all on function public.is_byound_staff(uuid) from public, anon;
revoke all on function public.staff_impersonation_active(uuid) from public, anon;
grant execute on function public.is_byound_staff(uuid) to authenticated, service_role;
grant execute on function public.staff_impersonation_active(uuid) to authenticated, service_role;

alter table public.org_notes enable row level security;
alter table public.org_activity enable row level security;
alter table public.impersonation_sessions enable row level security;
alter table public.org_billing_documents enable row level security;

drop policy if exists org_notes_staff on public.org_notes;
create policy org_notes_staff on public.org_notes
  for all
  using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists org_activity_select on public.org_activity;
create policy org_activity_select on public.org_activity
  for select
  using (
    public.is_byound_staff(auth.uid())
    or exists (
      select 1 from public.org_memberships m
      where m.org_id = org_activity.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists org_activity_insert on public.org_activity;
create policy org_activity_insert on public.org_activity
  for insert
  with check (
    public.is_byound_staff(auth.uid())
    or (
      actor_type = 'client'
      and actor_user_id = auth.uid()
      and exists (
        select 1 from public.org_memberships m
        where m.org_id = org_activity.org_id
          and m.user_id = auth.uid()
      )
    )
  );

drop policy if exists impersonation_sessions_staff_select on public.impersonation_sessions;
create policy impersonation_sessions_staff_select on public.impersonation_sessions
  for select
  using (public.is_byound_staff(auth.uid()));

drop policy if exists impersonation_sessions_staff_insert on public.impersonation_sessions;
create policy impersonation_sessions_staff_insert on public.impersonation_sessions
  for insert
  with check (
    public.is_byound_staff(auth.uid())
    and staff_user_id = auth.uid()
  );

drop policy if exists impersonation_sessions_staff_update on public.impersonation_sessions;
create policy impersonation_sessions_staff_update on public.impersonation_sessions
  for update
  using (public.is_byound_staff(auth.uid()) and staff_user_id = auth.uid())
  with check (public.is_byound_staff(auth.uid()) and staff_user_id = auth.uid());

drop policy if exists org_billing_staff on public.org_billing_documents;
create policy org_billing_staff on public.org_billing_documents
  for all
  using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

drop policy if exists org_billing_admin_select on public.org_billing_documents;
create policy org_billing_admin_select on public.org_billing_documents
  for select
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = org_billing_documents.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Masque les données sensibles pendant une session d'accompagnement, même en écriture.
do $$
declare
  target text;
begin
  foreach target in array ARRAY[
    'collaborateur_diagnostics',
    'mental_health_assessments',
    'mental_health_responses',
    'mental_health_indicators',
    'mental_health_notifications'
  ]
  loop
    if to_regclass('public.' || target) is not null then
      execute format('drop policy if exists impersonation_hides_%I on public.%I', target, target);
      execute format(
        'create policy impersonation_hides_%I on public.%I as restrictive for all using (not public.staff_impersonation_active(auth.uid())) with check (not public.staff_impersonation_active(auth.uid()))',
        target,
        target
      );
    end if;
  end loop;
end $$;

create or replace function public.org_revenue_summary(
  p_org_id uuid,
  p_from timestamptz,
  p_to timestamptz
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_status text;
  v_prev_from timestamptz;
  v_period bigint := 0;
  v_previous bigint := 0;
  v_collected bigint := 0;
  v_outstanding bigint := 0;
  v_overdue bigint := 0;
  v_quotes bigint := 0;
  v_opco bigint := 0;
  v_months jsonb := '[]'::jsonb;
  v_types jsonb := '{"formation":0,"plateforme":0,"open_badges":0,"tests":0}'::jsonb;
  v_cursor date;
  v_end date;
  v_month_total bigint;
  v_sale text;
  v_sale_total bigint;
begin
  if p_org_id is not null then
    select kind, status into v_kind, v_status
    from public.organizations
    where id = p_org_id;
    if v_kind = 'demo' or v_status = 'demo' then
      return jsonb_build_object(
        'period_ht_cents', 0,
        'previous_period_ht_cents', 0,
        'delta_ht_cents', 0,
        'collected_ht_cents', 0,
        'outstanding_ht_cents', 0,
        'overdue_ht_cents', 0,
        'quotes_ht_cents', 0,
        'opco_ht_cents', 0,
        'by_month', '[]'::jsonb,
        'by_sale_type', '{"formation":0,"plateforme":0,"open_badges":0,"tests":0}'::jsonb,
        'excluded_demo', true
      );
    end if;
  end if;

  v_prev_from := p_from - (p_to - p_from);

  select coalesce(sum(case when doc_type = 'invoice' then amount_ht_cents else -amount_ht_cents end), 0)
    into v_period
  from public.org_billing_documents d
  join public.organizations o on o.id = d.org_id
  where (p_org_id is null or d.org_id = p_org_id)
    and coalesce(o.kind, '') <> 'demo'
    and coalesce(o.status, '') <> 'demo'
    and d.doc_type in ('invoice', 'credit_note')
    and d.status in ('issued', 'paid', 'overdue')
    and d.issued_at >= p_from
    and d.issued_at < p_to;

  select coalesce(sum(case when doc_type = 'invoice' then amount_ht_cents else -amount_ht_cents end), 0)
    into v_previous
  from public.org_billing_documents d
  join public.organizations o on o.id = d.org_id
  where (p_org_id is null or d.org_id = p_org_id)
    and coalesce(o.kind, '') <> 'demo'
    and coalesce(o.status, '') <> 'demo'
    and d.doc_type in ('invoice', 'credit_note')
    and d.status in ('issued', 'paid', 'overdue')
    and d.issued_at >= v_prev_from
    and d.issued_at < p_from;

  select
    coalesce(sum(case when paid_at is not null then amount_ht_cents else 0 end), 0),
    coalesce(sum(case when paid_at is null then amount_ht_cents else 0 end), 0),
    coalesce(sum(case when paid_at is null and due_at is not null and due_at < now() then amount_ht_cents else 0 end), 0),
    coalesce(sum(opco_ht_cents), 0)
  into v_collected, v_outstanding, v_overdue, v_opco
  from public.org_billing_documents d
  join public.organizations o on o.id = d.org_id
  where (p_org_id is null or d.org_id = p_org_id)
    and coalesce(o.kind, '') <> 'demo'
    and coalesce(o.status, '') <> 'demo'
    and d.doc_type = 'invoice'
    and d.status in ('issued', 'paid', 'overdue')
    and d.issued_at >= p_from
    and d.issued_at < p_to;

  select coalesce(sum(amount_ht_cents), 0)
    into v_quotes
  from public.org_billing_documents d
  join public.organizations o on o.id = d.org_id
  where (p_org_id is null or d.org_id = p_org_id)
    and coalesce(o.kind, '') <> 'demo'
    and coalesce(o.status, '') <> 'demo'
    and d.doc_type = 'quote'
    and d.status in ('issued', 'draft')
    and d.issued_at >= p_from
    and d.issued_at < p_to;

  v_cursor := date_trunc('month', p_from)::date;
  v_end := date_trunc('month', p_to - interval '1 second')::date;
  while v_cursor <= v_end loop
    select coalesce(sum(case when doc_type = 'invoice' then amount_ht_cents else -amount_ht_cents end), 0)
      into v_month_total
    from public.org_billing_documents d
    join public.organizations o on o.id = d.org_id
    where (p_org_id is null or d.org_id = p_org_id)
      and coalesce(o.kind, '') <> 'demo'
      and coalesce(o.status, '') <> 'demo'
      and d.doc_type in ('invoice', 'credit_note')
      and d.status in ('issued', 'paid', 'overdue')
      and d.issued_at >= v_cursor::timestamptz
      and d.issued_at < (v_cursor + interval '1 month')::timestamptz
      and d.issued_at >= p_from
      and d.issued_at < p_to;
    v_months := v_months || jsonb_build_array(jsonb_build_object(
      'month', to_char(v_cursor, 'YYYY-MM'),
      'ht_cents', v_month_total
    ));
    v_cursor := (v_cursor + interval '1 month')::date;
  end loop;

  foreach v_sale in array array['formation', 'plateforme', 'open_badges', 'tests']
  loop
    select coalesce(sum(case when doc_type = 'invoice' then amount_ht_cents else -amount_ht_cents end), 0)
      into v_sale_total
    from public.org_billing_documents d
    join public.organizations o on o.id = d.org_id
    where (p_org_id is null or d.org_id = p_org_id)
      and coalesce(o.kind, '') <> 'demo'
      and coalesce(o.status, '') <> 'demo'
      and d.doc_type in ('invoice', 'credit_note')
      and d.status in ('issued', 'paid', 'overdue')
      and d.sale_type = v_sale
      and d.issued_at >= p_from
      and d.issued_at < p_to;
    v_types := jsonb_set(v_types, array[v_sale], to_jsonb(v_sale_total));
  end loop;

  return jsonb_build_object(
    'period_ht_cents', v_period,
    'previous_period_ht_cents', v_previous,
    'delta_ht_cents', v_period - v_previous,
    'collected_ht_cents', v_collected,
    'outstanding_ht_cents', v_outstanding,
    'overdue_ht_cents', v_overdue,
    'quotes_ht_cents', v_quotes,
    'opco_ht_cents', v_opco,
    'by_month', v_months,
    'by_sale_type', v_types,
    'excluded_demo', false
  );
end;
$$;

revoke all on function public.org_revenue_summary(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.org_revenue_summary(uuid, timestamptz, timestamptz) to service_role;
