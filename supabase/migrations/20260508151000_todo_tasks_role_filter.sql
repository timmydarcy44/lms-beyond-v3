-- Kanban : filtre par rôle (apprenant / formateur / tuteur / admin).

alter table public.todo_tasks add column if not exists role_filter text;

create index if not exists todo_tasks_school_role_idx
  on public.todo_tasks (school_id, role_filter, created_at desc);

comment on column public.todo_tasks.role_filter is 'learner | instructor | tutor | admin — aligné KanbanBoard.';
