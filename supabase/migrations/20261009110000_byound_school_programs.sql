create table if not exists public.byound_school_programs (
  specialization text primary key,
  format text not null default 'Alternance ou Initial',
  next_intake text not null default 'Lundi 4 janvier 2027',
  duration text not null default '12 mois',
  volume text not null default '',
  rhythm text not null default '1 journée de cours/semaine',
  location text not null default 'Byound',
  level text not null default '',
  seats_available text not null default '15',
  program_pdf_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.byound_school_programs enable row level security;

drop policy if exists byound_school_programs_public_read on public.byound_school_programs;
create policy byound_school_programs_public_read
  on public.byound_school_programs
  for select
  to anon, authenticated
  using (true);

grant select on public.byound_school_programs to anon, authenticated;
grant all on public.byound_school_programs to service_role;
