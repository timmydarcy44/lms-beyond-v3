-- Preuve d'acceptation devis/convention + identité devis (Lot neo-banque)

alter table public.formation_documents
  add column if not exists quote_number text,
  add column if not exists valid_until timestamptz,
  add column if not exists superseded_by uuid references public.formation_documents(id) on delete set null,
  add column if not exists pdf_content_hash text,
  add column if not exists cgv_version text,
  add column if not exists signer_name text,
  add column if not exists signer_role text,
  add column if not exists accepted_ip text,
  add column if not exists accepted_user_agent text,
  add column if not exists acceptance_method text;

comment on column public.formation_documents.quote_number is
  'Numéro de devis affiché (ex. DEV-7F3A21) — persisté à la génération';
comment on column public.formation_documents.valid_until is
  'Date de fin de validité commerciale (+ contrôle accès accept)';
comment on column public.formation_documents.superseded_by is
  'Devis remplacé par une version plus récente';
comment on column public.formation_documents.pdf_content_hash is
  'SHA-256 du PDF au moment de l''acceptation (version exacte)';
comment on column public.formation_documents.cgv_version is
  'Version / identifiant des CGV acceptées';
comment on column public.formation_documents.signer_name is
  'Nom saisi à l''acceptation publique';
comment on column public.formation_documents.signer_role is
  'Fonction saisie à l''acceptation publique';
comment on column public.formation_documents.accepted_ip is
  'IP du signataire (preuve simple)';
comment on column public.formation_documents.accepted_user_agent is
  'User-Agent du signataire';
comment on column public.formation_documents.acceptance_method is
  'simple_checkbox | yousign | … — branchement signature avancée';

create index if not exists formation_documents_quote_number_idx
  on public.formation_documents (quote_number)
  where quote_number is not null;
