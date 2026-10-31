-- Lot 1 du formulaire Open Badge.
-- Colonnes nullables. Le formulaire écrit déjà ces informations dans evaluation_config.builder.
-- Ne pas réécrire badge_assertions. Ne pas toucher aux badges délivrés.

alter table public.open_badges
  add column if not exists domain text,
  add column if not exists access_mode text not null default 'all',
  add column if not exists prerequisites jsonb not null default '[]'::jsonb,
  add column if not exists parent_badge_id uuid references public.open_badges (id),
  add column if not exists published_at timestamptz;

alter table public.open_badges
  drop constraint if exists open_badges_access_mode_check;

alter table public.open_badges
  add constraint open_badges_access_mode_check
  check (access_mode in ('all', 'org', 'invite'));
