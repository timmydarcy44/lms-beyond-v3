-- Ponctualité émargement : retard vs max(début créneau, ouverture réelle)
alter table public.attendance_signatures
  add column if not exists minutes_late integer not null default 0,
  add column if not exists punctuality_ref_at timestamptz,
  add column if not exists minutes_after_scheduled_start integer;

comment on column public.attendance_signatures.minutes_late is
  'Minutes après punctuality_ref_at + grâce 5 min (0 = à l''heure). Présence reste valide.';
comment on column public.attendance_signatures.punctuality_ref_at is
  'max(slot.starts_at, launch.opened_at) au moment de la signature.';
comment on column public.attendance_signatures.minutes_after_scheduled_start is
  'Écart vs starts_at planifié (audit) — n''implique pas le statut retard apprenant.';
