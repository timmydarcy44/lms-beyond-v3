-- CMS formations EDGE Business (structure publique, pas LMS)

alter table public.training_courses
  add column if not exists instructors jsonb default '[]'::jsonb,
  add column if not exists badge_class_id uuid,
  add column if not exists program_structure jsonb default '[]'::jsonb,
  add column if not exists page_blocks jsonb,
  add column if not exists sessions jsonb default '[]'::jsonb,
  add column if not exists benefits text[],
  add column if not exists case_studies text[],
  add column if not exists deliverables text[],
  add column if not exists methodology text[],
  add column if not exists illustrations text[];

comment on column public.training_courses.instructors is 'Intervenants [{expert_id, role, sort_order, first_name, last_name, headline, photo_url}]';
comment on column public.training_courses.badge_class_id is 'Référence open_badges.id';
comment on column public.training_courses.program_structure is 'Arborescence publique: sections > chapitres > sous-chapitres';
comment on column public.training_courses.page_blocks is 'Visibilité et ordre des blocs page publique';
comment on column public.training_courses.sessions is 'Sessions [{id, date, city, seats, price, format}]';

create index if not exists training_courses_badge_class_idx on public.training_courses(badge_class_id);
