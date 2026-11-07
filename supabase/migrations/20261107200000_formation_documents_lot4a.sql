-- Lot 4a — Tokens d'accès documents + horodatage génération

alter table public.formation_documents
  add column if not exists access_token text,
  add column if not exists generated_at timestamptz,
  add column if not exists last_sent_to text,
  add column if not exists accept_token text;

create unique index if not exists formation_documents_access_token_uidx
  on public.formation_documents (access_token)
  where access_token is not null;

create unique index if not exists formation_documents_accept_token_uidx
  on public.formation_documents (accept_token)
  where accept_token is not null;

comment on column public.formation_documents.access_token is
  'Jeton public lecture PDF (ouvert → status opened)';
comment on column public.formation_documents.accept_token is
  'Jeton public acceptation devis/convention (→ status signed) — Lot 4a minimal, Lot 5 page enrichie';
