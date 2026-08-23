-- Documents administratifs patients Jessica (reçus / stockés par le cabinet)

create table if not exists public.jessica_patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.jessica_cabinet_patients(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  file_name text not null,
  file_url text not null,
  mime_type text,
  file_size_bytes integer,
  category text not null default 'autre'
    check (category in ('ordonnance', 'compte_rendu', 'assurance', 'mdph', 'autre')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jessica_patient_documents_patient_idx
  on public.jessica_patient_documents (patient_id, created_at desc);

create index if not exists jessica_patient_documents_profile_idx
  on public.jessica_patient_documents (profile_id, created_at desc)
  where profile_id is not null;

alter table public.jessica_patient_documents enable row level security;

-- Accès via service role côté API admin Jessica ; policies restrictives pour clients anon/auth
drop policy if exists jessica_patient_documents_select_own on public.jessica_patient_documents;
create policy jessica_patient_documents_select_own
  on public.jessica_patient_documents
  for select
  using (auth.uid() = profile_id);

comment on table public.jessica_patient_documents is
  'Documents administratifs stockés par Jessica sur les fiches patients cabinet.';
