create table if not exists public.employee_test_views (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  viewer_id uuid not null,
  viewed_at timestamptz not null default now()
);

create index if not exists employee_test_views_employee_idx
  on public.employee_test_views (employee_id, viewed_at desc);

alter table public.employee_test_views enable row level security;

-- Aucune policy : écriture par le service role. Le salarié et les managers ne peuvent pas lire ce journal.
