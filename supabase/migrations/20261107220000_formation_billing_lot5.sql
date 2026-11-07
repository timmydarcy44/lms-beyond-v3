-- Lot 5 — Facturation formation + validations humaines + verrous

alter table public.of_settings
  add column if not exists invoice_prefix text not null default 'FAC',
  add column if not exists invoice_next_seq integer not null default 1;

alter table public.formation_dossiers
  add column if not exists trainer_user_id uuid references auth.users (id) on delete set null,
  add column if not exists trainer_assigned_at timestamptz,
  add column if not exists invoice_validated_at timestamptz,
  add column if not exists invoice_validated_by uuid references auth.users (id) on delete set null;

alter table public.formation_assignments
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references auth.users (id) on delete set null;

alter table public.org_billing_documents
  add column if not exists formation_dossier_id uuid references public.formation_dossiers (id) on delete set null,
  add column if not exists amount_tva_cents integer not null default 0,
  add column if not exists bpf_funder_type text,
  add column if not exists credit_of_id uuid references public.org_billing_documents (id) on delete set null,
  add column if not exists immutable boolean not null default false,
  add column if not exists e_invoice_export_stub jsonb;

create index if not exists org_billing_documents_dossier_idx
  on public.org_billing_documents (formation_dossier_id)
  where formation_dossier_id is not null;

create unique index if not exists org_billing_documents_number_uidx
  on public.org_billing_documents (number)
  where number is not null;

create table if not exists public.org_billing_lines (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.org_billing_documents (id) on delete cascade,
  label text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price_ht_cents integer not null default 0,
  tva_rate_bps integer not null default 2000, -- 20.00 %
  amount_ht_cents integer not null default 0,
  amount_tva_cents integer not null default 0,
  amount_ttc_cents integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists org_billing_lines_document_idx
  on public.org_billing_lines (document_id, sort_order);

alter table public.org_billing_lines enable row level security;

drop policy if exists org_billing_lines_staff on public.org_billing_lines;
create policy org_billing_lines_staff on public.org_billing_lines
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));

-- Empêche la modification d'une facture émise (immutable)
create or replace function public.org_billing_prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.immutable is true and old.doc_type = 'invoice' then
    if new.amount_ht_cents is distinct from old.amount_ht_cents
      or new.amount_ttc_cents is distinct from old.amount_ttc_cents
      or new.amount_tva_cents is distinct from old.amount_tva_cents
      or new.number is distinct from old.number
      or new.doc_type is distinct from old.doc_type
      or new.formation_dossier_id is distinct from old.formation_dossier_id
      or new.org_id is distinct from old.org_id
    then
      raise exception 'Facture émise non modifiable — utilisez un avoir';
    end if;
  end if;
  if tg_op = 'DELETE' and old.immutable is true and old.doc_type = 'invoice' then
    raise exception 'Facture émise non supprimable — utilisez un avoir';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists org_billing_immutable_trg on public.org_billing_documents;
create trigger org_billing_immutable_trg
  before update or delete on public.org_billing_documents
  for each row execute function public.org_billing_prevent_mutation();

comment on column public.org_billing_documents.e_invoice_export_stub is
  'Stub export facture électronique 2027 (structure réservée, non branchée)';
comment on column public.org_billing_documents.immutable is
  'Facture émise verrouillée applicativement + trigger';
