-- Profil croisé particulier : paragraphe email, badge, signal animation dashboard.

alter table public.profiles
  add column if not exists cross_profile_completion jsonb;

comment on column public.profiles.cross_profile_completion is
  'Profil croisé EDGE : opening_paragraph, badge_awarded_at, show_badge_animation, tests_signature, etc.';
