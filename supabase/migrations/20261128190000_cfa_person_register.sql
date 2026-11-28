-- Registre CFA : chaque échange / modification est horodaté et signé.

alter table public.cfa_person_touches
  add column if not exists actor_name text,
  add column if not exists actor_email text,
  add column if not exists proof_url text,
  add column if not exists proof jsonb not null default '{}'::jsonb;

alter table public.cfa_person_touches
  drop constraint if exists cfa_person_touches_type_check;

alter table public.cfa_person_touches
  add constraint cfa_person_touches_type_check check (
    type in (
      'brochure_download',
      'preregistration',
      'email_sent',
      'email_opened',
      'call',
      'meeting',
      'stage_change',
      'created',
      'follow_up',
      'field_change',
      'document',
      'placement',
      'curriculum',
      'note'
    )
  );

comment on column public.cfa_person_touches.actor_name is
  'Nom figé de la personne (ou « Site Byound School ») au moment de l’événement.';
comment on column public.cfa_person_touches.proof_url is
  'Preuve concrète : lien du mail, document, etc.';
