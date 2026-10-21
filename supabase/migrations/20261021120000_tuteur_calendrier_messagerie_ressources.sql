-- Calendrier, messagerie et ressources de l'espace tuteur.
-- Ne recrée pas tutor_assignments ni apprenticeship_booklets.

create table if not exists public.tutor_appointments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  apprentice_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  is_remote boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  constraint tutor_appointments_type_chk check (type in ('monthly', 'onboarding', 'tripartite', 'other')),
  constraint tutor_appointments_range_chk check (ends_at > starts_at)
);

create index if not exists tutor_appointments_tutor_idx on public.tutor_appointments (tutor_id, starts_at);

alter table public.tutor_appointments enable row level security;

drop policy if exists tutor_appointments_tutor on public.tutor_appointments;
create policy tutor_appointments_tutor on public.tutor_appointments
  for all
  using (
    tutor_id = auth.uid()
    and exists (
      select 1 from public.tutor_assignments a
      where a.tutor_id = auth.uid()
        and a.learner_id = tutor_appointments.apprentice_id
        and a.status in ('active', 'paused')
    )
  )
  with check (
    tutor_id = auth.uid()
    and exists (
      select 1 from public.tutor_assignments a
      where a.tutor_id = auth.uid()
        and a.learner_id = tutor_appointments.apprentice_id
        and a.status in ('active', 'paused')
    )
  );

drop policy if exists tutor_appointments_apprentice_read on public.tutor_appointments;
create policy tutor_appointments_apprentice_read on public.tutor_appointments
  for select
  using (apprentice_id = auth.uid());

-- Tables dédiées : public.messages existe déjà (consignes LMS) et n'a pas conversation_id.
create table if not exists public.tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  created_at timestamptz not null default now(),
  constraint tutor_conversations_type_chk check (type in ('direct'))
);

create table if not exists public.tutor_conversation_participants (
  conversation_id uuid not null references public.tutor_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tutor_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text,
  mission_id uuid,
  attachment_path text,
  attachment_name text,
  attachment_size integer,
  created_at timestamptz not null default now()
);

create index if not exists tutor_messages_conversation_created_idx on public.tutor_messages (conversation_id, created_at);

alter table public.tutor_conversations enable row level security;
alter table public.tutor_conversation_participants enable row level security;
alter table public.tutor_messages enable row level security;

drop policy if exists tutor_conversations_participant on public.tutor_conversations;
create policy tutor_conversations_participant on public.tutor_conversations
  for select
  using (
    exists (
      select 1 from public.tutor_conversation_participants p
      where p.conversation_id = tutor_conversations.id and p.user_id = auth.uid()
    )
  );

drop policy if exists tutor_conversation_participants_self on public.tutor_conversation_participants;
create policy tutor_conversation_participants_self on public.tutor_conversation_participants
  for select
  using (
    exists (
      select 1 from public.tutor_conversation_participants mine
      where mine.conversation_id = tutor_conversation_participants.conversation_id
        and mine.user_id = auth.uid()
    )
  );

drop policy if exists tutor_conversation_participants_read_update on public.tutor_conversation_participants;
create policy tutor_conversation_participants_read_update on public.tutor_conversation_participants
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists tutor_messages_participant on public.tutor_messages;
create policy tutor_messages_participant on public.tutor_messages
  for select
  using (
    exists (
      select 1 from public.tutor_conversation_participants p
      where p.conversation_id = tutor_messages.conversation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists tutor_messages_insert_sender on public.tutor_messages;
create policy tutor_messages_insert_sender on public.tutor_messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.tutor_conversation_participants p
      where p.conversation_id = tutor_messages.conversation_id and p.user_id = auth.uid()
    )
  );

create or replace function public.create_tutor_conversation(peer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing uuid;
  created uuid;
  allowed boolean;
begin
  if auth.uid() is null then
    raise exception 'non authentifie';
  end if;

  select exists (
    select 1
    from public.tutor_assignments a
    where a.status in ('active', 'paused')
      and (
        (a.tutor_id = auth.uid() and a.learner_id = peer_id)
        or (a.learner_id = auth.uid() and a.tutor_id = peer_id)
        or (
          a.tutor_id = auth.uid()
          and exists (
            select 1 from public.apprenticeship_booklets b
            where b.tutor_id = auth.uid()
              and b.student_id = a.learner_id
              and b.cfa_referent_id = peer_id
          )
        )
        or (
          a.tutor_id = auth.uid()
          and exists (
            select 1
            from public.class_enrollments e
            join public.school_planning_slots s on s.class_id = e.class_id
            join public.school_instructors i on i.id = s.instructor_id
            where e.student_id = a.learner_id
              and i.profile_id = peer_id
          )
        )
      )
  ) into allowed;

  if not allowed then
    raise exception 'destinataire non autorise';
  end if;

  select c.id into existing
  from public.tutor_conversations c
  join public.tutor_conversation_participants p1 on p1.conversation_id = c.id and p1.user_id = auth.uid()
  join public.tutor_conversation_participants p2 on p2.conversation_id = c.id and p2.user_id = peer_id
  where c.type = 'direct'
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.tutor_conversations (type) values ('direct') returning id into created;
  insert into public.tutor_conversation_participants (conversation_id, user_id)
  values (created, auth.uid()), (created, peer_id);
  return created;
end $$;

revoke all on function public.create_tutor_conversation(uuid) from public;
grant execute on function public.create_tutor_conversation(uuid) to authenticated;

create table if not exists public.tutor_resources (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  format text,
  url text,
  storage_path text,
  external boolean not null default false,
  is_featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint tutor_resources_category_chk check (category in ('guide', 'template', 'aid', 'rules', 'video'))
);

create table if not exists public.tutor_resource_views (
  user_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.tutor_resources (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

alter table public.tutor_resources enable row level security;
alter table public.tutor_resource_views enable row level security;

drop policy if exists tutor_resources_read on public.tutor_resources;
create policy tutor_resources_read on public.tutor_resources
  for select
  using (
    published = true
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(coalesce(p.role, '')) in ('tutor', 'tuteur', 'admin', 'super_admin')
    )
  );

drop policy if exists tutor_resources_admin on public.tutor_resources;
create policy tutor_resources_admin on public.tutor_resources
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(coalesce(p.role, '')) in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(coalesce(p.role, '')) in ('admin', 'super_admin')
    )
  );

drop policy if exists tutor_resource_views_self on public.tutor_resource_views;
create policy tutor_resource_views_self on public.tutor_resource_views
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into public.tutor_resources (category, title, description, format, external, is_featured, published, sort_order)
select * from (values
  ('guide', 'Guide du tuteur', 'Votre rôle, le livret, les évaluations et les visites.', 'PDF', false, true, false, 0),
  ('guide', 'Accueillir un alternant', 'Check-list des premières semaines.', 'Guide', false, false, false, 1),
  ('template', 'Trame d''entretien', 'Questions et points de vigilance.', 'DOCX / PDF', false, false, false, 2),
  ('template', 'Préparer la visite tripartite', 'Documents à avoir sous la main.', 'PDF', false, false, false, 3),
  ('template', 'Grille d''évaluation', 'Critères par bloc de compétences.', 'PDF', false, false, false, 4),
  ('aid', 'Aides employeur', 'Dispositifs et démarches, sur le site officiel.', 'Lien', true, false, false, 5),
  ('rules', 'Temps de travail et absences', 'Ce que prévoit le contrat et comment signaler une absence.', 'Fiche', false, false, false, 6),
  ('video', 'Donner un feedback', 'Une méthode en trois temps.', 'Vidéo', false, false, false, 7)
) as seed(category, title, description, format, external, is_featured, published, sort_order)
where not exists (select 1 from public.tutor_resources);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tutor_messages'
  ) then
    alter publication supabase_realtime add table public.tutor_messages;
  end if;
end $$;
