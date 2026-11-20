-- Provenance marketing / commerciale des candidatures CFA (JPO, SEO, SEA…).
alter table public.cfa_applications
  add column if not exists lead_source text;

alter table public.cfa_applications
  drop constraint if exists cfa_applications_lead_source_check;

alter table public.cfa_applications
  add constraint cfa_applications_lead_source_check check (
    lead_source is null
    or lead_source in (
      'jpo',
      'website',
      'sea',
      'seo',
      'social',
      'referral',
      'partner',
      'salon',
      'phone',
      'email',
      'other'
    )
  );

comment on column public.cfa_applications.lead_source is
  'Canal d’acquisition du prospect (JPO, Site web, SEA, SEO, etc.).';

create index if not exists cfa_applications_lead_source_idx
  on public.cfa_applications (lead_source)
  where lead_source is not null;
