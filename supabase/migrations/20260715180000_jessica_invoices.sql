-- Factures cabinet Jessica Contentin (numérotation type FAC1802+)
create table if not exists public.jessica_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_label text not null,
  client_email text,
  client_user_id uuid,
  amount_cents integer not null check (amount_cents > 0),
  designation text not null default 'Consultation',
  payment_method text not null default 'Carte bancaire',
  invoice_date date not null default (current_date),
  consultation_date date,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists jessica_invoices_created_at_idx
  on public.jessica_invoices (created_at desc);

alter table public.jessica_invoices enable row level security;
