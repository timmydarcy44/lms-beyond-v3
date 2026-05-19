-- Fix: `courses.level` must accept exactly the 5 canonical values (Title Case, accents).
-- Error observed: violates check constraint "check_course_level" (23514) when publishing.
-- Important:
-- - Drop existing constraint first (it may reject our normalization).
-- - Normalize existing rows.
-- - Recreate constraint.

alter table public.courses
  drop constraint if exists check_course_level;

-- 1) Normalize legacy/capitalized/common variants.
update public.courses
set level = case
  when level in ('Débutant', 'DEBUTANT', 'Debutant', 'debutant', 'débutant', 'beginner') then 'Débutant'
  when level in ('Acquisition', 'ACQUISITION', 'acquisition') then 'Acquisition'
  when level in ('Intermédiaire', 'INTERMEDIAIRE', 'Intermediaire', 'intermediaire', 'intermédiaire', 'intermediate') then 'Intermédiaire'
  when level in ('Spécialiste', 'SPECIALISTE', 'Specialiste', 'specialiste', 'spécialiste', 'specialist') then 'Spécialiste'
  when level in ('Expert', 'EXPERT', 'expert', 'advanced', 'Avancé', 'AVANCE', 'Avance', 'avance') then 'Expert'
  else level
end
where level is not null;

-- 2) Any remaining unknown values would break the check constraint.
update public.courses
set level = null
where level is not null
  and level not in ('Débutant', 'Acquisition', 'Intermédiaire', 'Spécialiste', 'Expert');

-- 3) (Re)create the constraint with the allowed set.
alter table public.courses
  add constraint check_course_level
  check (
    level is null
    or level in ('Débutant', 'Acquisition', 'Intermédiaire', 'Spécialiste', 'Expert')
  );

