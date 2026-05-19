-- Denormalized category label (sync with course_categories.name when category_id is set)
alter table public.courses add column if not exists category_name text;

-- category_id: link to course_categories (user may have added column already)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'category_id'
  ) then
    alter table public.courses
      add column category_id uuid references public.course_categories (id) on delete set null;
  end if;
end $$;

create index if not exists courses_category_id_idx on public.courses (category_id);
