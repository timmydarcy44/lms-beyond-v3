-- Lie chaque page cursus Byound School à une formation LMS (courses).
alter table public.byound_school_programs
  add column if not exists lms_course_id uuid references public.courses (id) on delete set null;

create index if not exists byound_school_programs_lms_course_id_idx
  on public.byound_school_programs (lms_course_id)
  where lms_course_id is not null;
