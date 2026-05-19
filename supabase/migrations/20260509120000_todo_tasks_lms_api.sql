-- Table todo_tasks alignée sur src/app/api/todo-tasks/route.ts (dashboard école / Ma todo).
-- school_id = auth.uid() du compte qui gère le kanban (pas profiles.school_id organisation).

create extension if not exists pgcrypto;

create table if not exists public.todo_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'normal',
  school_id uuid not null references auth.users (id) on delete cascade,
  -- Aligné sur src/app/api/todo-tasks/[taskId]/route.ts (vérif propriété)
  user_id uuid generated always as (school_id) stored,
  assigned_to_user_id uuid references auth.users (id) on delete set null,
  due_date timestamptz,
  task_type text,
  linked_content_type text,
  linked_content_id uuid,
  estimated_duration_minutes integer,
  actual_duration_minutes integer,
  tags text[],
  subtasks jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  kanban_position integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists todo_tasks_school_id_created_idx
  on public.todo_tasks (school_id, created_at desc);

comment on table public.todo_tasks is 'Tâches kanban LMS ; filtrées par school_id (= auth.uid() côté API).';
comment on column public.todo_tasks.school_id is 'UUID du compte propriétaire des tâches (auth.users.id), utilisé par /api/todo-tasks.';

alter table public.todo_tasks enable row level security;

drop policy if exists "todo_tasks_select_own" on public.todo_tasks;
create policy "todo_tasks_select_own"
  on public.todo_tasks for select
  using (auth.uid() = school_id);

drop policy if exists "todo_tasks_insert_own" on public.todo_tasks;
create policy "todo_tasks_insert_own"
  on public.todo_tasks for insert
  with check (auth.uid() = school_id);

drop policy if exists "todo_tasks_update_own" on public.todo_tasks;
create policy "todo_tasks_update_own"
  on public.todo_tasks for update
  using (auth.uid() = school_id);

drop policy if exists "todo_tasks_delete_own" on public.todo_tasks;
create policy "todo_tasks_delete_own"
  on public.todo_tasks for delete
  using (auth.uid() = school_id);
