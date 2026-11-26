-- Textes d'interprétation pour Mes bilans (salarié).
-- Contenu métier à rédiger : ne pas inventer côté app — placeholders « À RÉDIGER ».

create table if not exists public.interpretation_texts (
  id uuid primary key default gen_random_uuid(),
  test text not null check (test in ('disc', 'idmc', 'soft')),
  dimension text not null default '*',
  band text not null default 'any' check (band in ('low', 'mid', 'high', 'any')),
  kind text not null check (
    kind in (
      'definition',
      'observation',
      'appui',
      'vigilance',
      'travailler',
      'ce_que_ca_veut_dire',
      'echelle'
    )
  ),
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test, dimension, band, kind)
);

comment on table public.interpretation_texts is
  'Interprétations Mes bilans. Placeholder « À RÉDIGER » jusqu''à rédaction métier.';

alter table public.interpretation_texts enable row level security;

-- Lecture authentifiée seule (pas d''écriture client).
drop policy if exists interpretation_texts_select_authenticated on public.interpretation_texts;
create policy interpretation_texts_select_authenticated
  on public.interpretation_texts
  for select
  to authenticated
  using (true);

-- Seed : placeholders structurés + définitions DISC déjà présentes dans le code.
insert into public.interpretation_texts (test, dimension, band, kind, text) values
  ('disc', 'D', 'any', 'definition', 'Tu privilégies l''action, les décisions rapides et les objectifs clairs.'),
  ('disc', 'I', 'any', 'definition', 'Tu mises sur la communication, l''enthousiasme et la mobilisation des autres.'),
  ('disc', 'S', 'any', 'definition', 'Tu recherches la stabilité, l''écoute et un rythme de travail régulier.'),
  ('disc', 'C', 'any', 'definition', 'Tu valorises la rigueur, la qualité et le respect des procédures.'),
  ('disc', 'D', 'any', 'appui', 'À RÉDIGER'),
  ('disc', 'I', 'any', 'appui', 'À RÉDIGER'),
  ('disc', 'S', 'any', 'appui', 'À RÉDIGER'),
  ('disc', 'C', 'any', 'appui', 'À RÉDIGER'),
  ('disc', 'D', 'any', 'vigilance', 'À RÉDIGER'),
  ('disc', 'I', 'any', 'vigilance', 'À RÉDIGER'),
  ('disc', 'S', 'any', 'vigilance', 'À RÉDIGER'),
  ('disc', 'C', 'any', 'vigilance', 'À RÉDIGER'),
  ('disc', 'D', 'any', 'travailler', 'À RÉDIGER'),
  ('disc', 'I', 'any', 'travailler', 'À RÉDIGER'),
  ('disc', 'S', 'any', 'travailler', 'À RÉDIGER'),
  ('disc', 'C', 'any', 'travailler', 'À RÉDIGER'),
  ('idmc', '*', 'any', 'echelle', 'Chaque aptitude est notée sur 100. Le trait à 50 marque le milieu de l''échelle (pas une moyenne population).'),
  ('idmc', '*', 'any', 'ce_que_ca_veut_dire', 'À RÉDIGER'),
  ('soft', '*', 'any', 'echelle', 'Chaque soft skill est affichée sur 100 (conversion depuis le score /15 du test).'),
  ('soft', '*', 'any', 'ce_que_ca_veut_dire', 'À RÉDIGER')
on conflict (test, dimension, band, kind) do nothing;
