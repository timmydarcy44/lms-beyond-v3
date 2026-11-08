-- Formations LMS mises à disposition d'une organisation (sans changer courses.org_id)
create table if not exists public.organization_lms_courses (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null,
  source text not null default 'super_admin',
  primary key (organization_id, course_id)
);

create index if not exists organization_lms_courses_org_idx
  on public.organization_lms_courses (organization_id);

alter table public.organization_lms_courses enable row level security;

-- Accès service role / staff via bypass ; membres org en lecture
drop policy if exists organization_lms_courses_select_member on public.organization_lms_courses;
create policy organization_lms_courses_select_member on public.organization_lms_courses
  for select using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = organization_lms_courses.organization_id
        and m.user_id = auth.uid()
    )
  );
