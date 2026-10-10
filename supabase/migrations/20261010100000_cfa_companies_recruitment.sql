alter table public.cfa_companies
  add column if not exists siret text,
  add column if not exists apprentices_wanted integer,
  add column if not exists apprentice_track_1 text,
  add column if not exists apprentice_track_2 text;

alter table public.cfa_companies drop constraint if exists cfa_companies_status_check;

update public.cfa_companies
set status = 'to_contact'
where status not in (
  'to_contact',
  'email_sent',
  'appointment',
  'pending_decision',
  'recruiting',
  'recruited',
  'not_recruited'
);

alter table public.cfa_companies
  alter column status set default 'to_contact';

alter table public.cfa_companies
  add constraint cfa_companies_status_check check (
    status in (
      'to_contact',
      'email_sent',
      'appointment',
      'pending_decision',
      'recruiting',
      'recruited',
      'not_recruited'
    )
  );

alter table public.cfa_companies drop constraint if exists cfa_companies_apprentices_check;

alter table public.cfa_companies
  add constraint cfa_companies_apprentices_check check (
    apprentices_wanted is null or apprentices_wanted between 1 and 2
  );
