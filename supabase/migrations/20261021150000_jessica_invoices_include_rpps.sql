-- Case « Mettre le numéro RPPS » sur les factures de Jessica Contentin.
-- Décochée par défaut : les factures déjà émises restent sans RPPS.
alter table public.jessica_invoices
  add column if not exists include_rpps boolean not null default false;
