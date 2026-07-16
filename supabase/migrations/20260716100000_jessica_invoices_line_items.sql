alter table public.jessica_invoices
  add column if not exists section_title text not null default 'Consultation psychopédagogique',
  add column if not exists line_items jsonb not null default '[]'::jsonb;
