alter table public.cfa_applications
  drop constraint if exists cfa_applications_status_check;

alter table public.cfa_applications
  add constraint cfa_applications_status_check check (
    status in (
      'brochure',
      'profile',
      'challenge',
      'dossier',
      'interview',
      'review',
      'administrative',
      'admitted',
      'rejected'
    )
  );

alter table public.byound_school_programs
  add column if not exists hero_image_url text not null default '';

do $$
begin
  if to_regclass('public.cfa_program_downloads') is not null then
    insert into public.cfa_applications (status, first_name, last_name, email, phone, specialization)
    select 'brochure', d.first_name, d.last_name, lower(d.email), d.phone, d.specialization
    from public.cfa_program_downloads d
    where not exists (
      select 1
      from public.cfa_applications a
      where lower(a.email) = lower(d.email)
        and a.status <> 'rejected'
    );
  end if;
end $$;
