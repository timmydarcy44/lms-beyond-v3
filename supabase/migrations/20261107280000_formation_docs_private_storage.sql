-- Stockage privé des PDF formation (plus d'URL publique prévisible)
insert into storage.buckets (id, name, public)
values ('formation-docs', 'formation-docs', false)
on conflict (id) do update set public = false;

-- Lecture / écriture uniquement via service role (pas de policy anon/authenticated)
drop policy if exists formation_docs_public_read on storage.objects;
drop policy if exists formation_docs_anon_read on storage.objects;

alter table public.formation_documents
  add column if not exists storage_bucket text,
  add column if not exists storage_path text;

comment on column public.formation_documents.storage_path is
  'Chemin objet dans le bucket privé — accès uniquement via /api/formation-documents/[token]';
comment on column public.formation_documents.file_url is
  'Réf privée private://bucket/path, ou null. Ne plus stocker d''URL publique.';

-- Invalider les anciennes URL publiques (énumérables) déjà en base
update public.formation_documents
set file_url = null, updated_at = now()
where file_url is not null
  and file_url like '%/storage/v1/object/public/%';
