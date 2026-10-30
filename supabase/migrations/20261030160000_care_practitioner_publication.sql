-- Publication des fiches Byound Care : compte de test, favoris, alertes de créneaux, photos publiques.

alter table public.care_profiles
  add column if not exists is_test boolean not null default false;

update public.care_profiles p
set is_test = true
from public.experts e
where e.id = p.expert_id
  and lower(e.email) in (
    'anais.care.demo@byound.fr',
    'timmydarcy44+expertpro@gmail.com',
    'timmydarcy44+testexpertlol@gmail.com'
  );

update public.care_profiles
set is_test = true
where expert_id = 'c4e0a0a1-1111-4111-8111-0000000000a1';

create or replace function public.care_profile_is_public(p_expert_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.care_profiles p
    join public.experts e on e.id = p.expert_id
    where p.expert_id = p_expert_id
      and p.published
      and p.is_care
      and p.is_test = false
      and lower(e.email) not in (
        'anais.care.demo@byound.fr',
        'timmydarcy44+expertpro@gmail.com',
        'timmydarcy44+testexpertlol@gmail.com'
      )
  );
$$;

create table if not exists public.care_practitioner_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  expert_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, expert_id)
);

alter table public.care_practitioner_favorites enable row level security;

create table if not exists public.care_slot_watches (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  constraint care_slot_watches_email_len check (char_length(email) between 5 and 180)
);

create unique index if not exists care_slot_watches_expert_email_uidx
  on public.care_slot_watches (expert_id, lower(email));

alter table public.care_slot_watches enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'practitioner-photos',
  'practitioner-photos',
  true,
  5242880,
  array['image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read practitioner photos" on storage.objects;
create policy "Public read practitioner photos"
  on storage.objects for select
  using (bucket_id = 'practitioner-photos');

drop policy if exists "Care expert write own practitioner photo" on storage.objects;
create policy "Care expert write own practitioner photo"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'practitioner-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'practitioner-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
