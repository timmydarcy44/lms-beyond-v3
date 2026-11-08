-- Lien optionnel fiche catalogue → formation LMS (courses)
ALTER TABLE public.training_courses
  ADD COLUMN IF NOT EXISTS lms_course_id uuid;

COMMENT ON COLUMN public.training_courses.lms_course_id IS
  'Formation LMS (courses.id) créée depuis program_structure — pas de sync bidirectionnelle.';

CREATE INDEX IF NOT EXISTS training_courses_lms_course_id_idx
  ON public.training_courses (lms_course_id)
  WHERE lms_course_id IS NOT NULL;
