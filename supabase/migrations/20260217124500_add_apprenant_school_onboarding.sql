alter table if exists apprenants
add column if not exists school_id uuid;

alter table if exists apprenants
add column if not exists onboarding_step smallint default 1;
