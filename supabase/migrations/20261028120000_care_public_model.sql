-- Byound Care — modèle public (profils, services, disponibilités, réservations).
-- À coller dans le SQL Editor. Ne pas exécuter depuis l'app.

begin;

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'care_domain') then
    create type public.care_domain as enum (
      'emotions',
      'attention',
      'famille',
      'couple',
      'performance',
      'carriere'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'care_session_format') then
    create type public.care_session_format as enum ('cabinet', 'visio');
  end if;
  if not exists (select 1 from pg_type where typname = 'care_rule_format') then
    create type public.care_rule_format as enum ('cabinet', 'visio', 'both');
  end if;
  if not exists (select 1 from pg_type where typname = 'care_booking_status') then
    create type public.care_booking_status as enum (
      'confirmed',
      'cancelled_client',
      'cancelled_expert',
      'completed'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'care_booking_for_whom') then
    create type public.care_booking_for_whom as enum ('self', 'child', 'relative');
  end if;
  if not exists (select 1 from pg_type where typname = 'care_payment_method') then
    create type public.care_payment_method as enum ('on_site', 'card', 'wallet');
  end if;
end $$;

create table if not exists public.care_profiles (
  expert_id uuid primary key references public.experts (id) on delete cascade,
  slug text not null,
  published boolean not null default false,
  is_care boolean not null default false,
  display_name text not null default '',
  title text not null default '',
  tagline text not null default '',
  headline text not null default '',
  bio text not null default '',
  approach text not null default '',
  avatar_url text,
  domains public.care_domain[] not null default '{}'::public.care_domain[],
  publics text[] not null default '{}'::text[],
  city text,
  address text,
  offers_cabinet boolean not null default false,
  offers_visio boolean not null default true,
  languages text[] not null default '{}'::text[],
  payment_methods text[] not null default '{}'::text[],
  cancellation_hours integer not null default 24,
  member_since date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_profiles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint care_profiles_tagline_len check (char_length(tagline) <= 140),
  constraint care_profiles_cancellation check (cancellation_hours >= 0),
  constraint care_profiles_domains_published check (not published or cardinality(domains) >= 1)
);

create unique index if not exists care_profiles_slug_uidx on public.care_profiles (slug);
create index if not exists care_profiles_public_idx
  on public.care_profiles (published, is_care)
  where published and is_care;

create table if not exists public.care_services (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  position integer not null default 0,
  name text not null,
  domain public.care_domain not null,
  description text not null default '',
  duration_min integer not null,
  formats public.care_session_format[] not null,
  price_cents integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint care_services_duration check (duration_min > 0),
  constraint care_services_price check (price_cents >= 0),
  constraint care_services_formats check (cardinality(formats) >= 1)
);

create index if not exists care_services_expert_idx on public.care_services (expert_id, position);

create table if not exists public.care_experiences (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  position integer not null default 0,
  period_label text not null,
  role text not null,
  organization text not null default '',
  description text not null default ''
);

create index if not exists care_experiences_expert_idx on public.care_experiences (expert_id, position);

create table if not exists public.care_trainings (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  position integer not null default 0,
  year text not null,
  title text not null,
  organization text not null default ''
);

create index if not exists care_trainings_expert_idx on public.care_trainings (expert_id, position);

create table if not exists public.care_availability_rules (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  position integer not null default 0,
  weekday smallint not null,
  start_time time not null,
  end_time time not null,
  format public.care_rule_format not null default 'visio',
  constraint care_availability_rules_weekday check (weekday between 0 and 6),
  constraint care_availability_rules_span check (end_time > start_time)
);

create index if not exists care_availability_rules_expert_idx
  on public.care_availability_rules (expert_id, weekday);

create table if not exists public.care_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  position integer not null default 0,
  date date not null,
  is_closed boolean not null default true,
  start_time time,
  end_time time,
  constraint care_availability_exceptions_span check (
    start_time is null or end_time is null or end_time > start_time
  )
);

create index if not exists care_availability_exceptions_expert_idx
  on public.care_availability_exceptions (expert_id, date);

create table if not exists public.care_bookings (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.care_profiles (expert_id) on delete restrict,
  service_id uuid not null references public.care_services (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  format public.care_session_format not null,
  status public.care_booking_status not null default 'confirmed',
  for_whom public.care_booking_for_whom not null,
  domain public.care_domain not null,
  client_first_name text not null,
  client_last_name text not null,
  client_email text not null,
  client_phone text,
  child_first_name text,
  child_age integer,
  message text,
  payment_method public.care_payment_method not null,
  consent_at timestamptz not null,
  access_token text not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now(),
  constraint care_bookings_span check (ends_at > starts_at),
  constraint care_bookings_child_age check (child_age is null or child_age between 0 and 25)
);

create unique index if not exists care_bookings_token_uidx on public.care_bookings (access_token);
create index if not exists care_bookings_expert_starts_idx on public.care_bookings (expert_id, starts_at);

alter table public.care_bookings drop constraint if exists care_bookings_no_overlap;
alter table public.care_bookings
  add constraint care_bookings_no_overlap
  exclude using gist (
    expert_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status = 'confirmed');

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
    where p.expert_id = p_expert_id
      and p.published
      and p.is_care
  );
$$;

create or replace function public.care_touch_profile()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists care_profiles_touch on public.care_profiles;
create trigger care_profiles_touch
  before update on public.care_profiles
  for each row execute function public.care_touch_profile();

create or replace function public.care_sync_expert_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.experts
  set is_care_expert = new.is_care
  where id = new.expert_id;
  return new;
end;
$$;

drop trigger if exists care_profiles_sync_flag on public.care_profiles;
create trigger care_profiles_sync_flag
  after insert or update of is_care on public.care_profiles
  for each row execute function public.care_sync_expert_flag();

create or replace function public.care_bookings_guard_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.expert_id is distinct from old.expert_id
     or new.service_id is distinct from old.service_id
     or new.starts_at is distinct from old.starts_at
     or new.ends_at is distinct from old.ends_at
     or new.client_email is distinct from old.client_email
     or new.client_first_name is distinct from old.client_first_name
     or new.client_last_name is distinct from old.client_last_name
     or new.client_phone is distinct from old.client_phone
     or new.child_first_name is distinct from old.child_first_name
     or new.child_age is distinct from old.child_age
     or new.message is distinct from old.message
     or new.access_token is distinct from old.access_token
     or new.consent_at is distinct from old.consent_at
     or new.for_whom is distinct from old.for_whom
     or new.domain is distinct from old.domain
     or new.payment_method is distinct from old.payment_method
     or new.format is distinct from old.format
  then
    raise exception 'care_bookings: seuls le statut peut être modifié par le praticien'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists care_bookings_guard_update on public.care_bookings;
create trigger care_bookings_guard_update
  before update on public.care_bookings
  for each row execute function public.care_bookings_guard_update();

create or replace view public.care_expert_badges
with (security_invoker = true) as
select
  p.expert_id,
  ob.id as badge_id,
  coalesce(nullif(ob.name, ''), ob.title, 'Open Badge') as name,
  ob.image_url,
  coalesce(nullif(kv.value ->> 'shareUrl', ''), '/badgeclasses/' || ob.id::text) as verification_url,
  nullif(kv.value ->> 'awardedAt', '')::timestamptz as awarded_at
from public.care_profiles p
join public.open_badges ob
  on ob.evaluation_config ? 'learnerAwards'
join lateral jsonb_each(coalesce(ob.evaluation_config -> 'learnerAwards', '{}'::jsonb)) as kv(key, value)
  on kv.key = p.expert_id::text
where kv.value ? 'awardedAt';

create or replace view public.care_directory
with (security_invoker = true) as
select
  p.expert_id,
  p.slug,
  p.display_name,
  p.title,
  p.tagline,
  p.headline,
  p.avatar_url,
  p.domains,
  p.city,
  p.offers_cabinet,
  p.offers_visio,
  p.publics,
  p.member_since,
  coalesce(b.badge_count, 0)::integer as badge_count,
  s.min_price_cents
from public.care_profiles p
left join lateral (
  select min(cs.price_cents) as min_price_cents
  from public.care_services cs
  where cs.expert_id = p.expert_id and cs.active
) s on true
left join lateral (
  select count(*)::integer as badge_count
  from public.care_expert_badges beb
  where beb.expert_id = p.expert_id
) b on true
where p.published and p.is_care;

create or replace function public.get_care_booking_by_token(p_id uuid, p_token text)
returns setof public.care_bookings
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.care_bookings
  where id = p_id
    and access_token = p_token
    and length(coalesce(p_token, '')) >= 16;
$$;

create or replace function public.get_available_slots(
  p_expert_id uuid,
  p_service_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (starts_at timestamptz, ends_at timestamptz, format public.care_session_format)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_duration interval;
  v_formats public.care_session_format[];
  v_day date;
  v_rule record;
  v_exc record;
  v_win_start timestamptz;
  v_win_end timestamptz;
  v_cursor timestamptz;
  v_end timestamptz;
  v_fmt public.care_session_format;
  v_fmt_list public.care_session_format[];
begin
  if p_to <= p_from then
    return;
  end if;
  if not (
    public.care_profile_is_public(p_expert_id)
    or auth.uid() = p_expert_id
  ) then
    return;
  end if;

  select make_interval(mins => cs.duration_min), cs.formats
    into v_duration, v_formats
  from public.care_services cs
  where cs.id = p_service_id
    and cs.expert_id = p_expert_id
    and cs.active;
  if v_duration is null then
    return;
  end if;

  for v_day in
    select generate_series(
      (p_from at time zone 'Europe/Paris')::date,
      (p_to at time zone 'Europe/Paris')::date,
      interval '1 day'
    )::date
  loop
    for v_rule in
      select *
      from public.care_availability_rules r
      where r.expert_id = p_expert_id
        and r.weekday = extract(dow from v_day)::int
    loop
      v_fmt_list := case v_rule.format
        when 'both' then array['cabinet'::public.care_session_format, 'visio'::public.care_session_format]
        when 'cabinet' then array['cabinet'::public.care_session_format]
        else array['visio'::public.care_session_format]
      end;
      foreach v_fmt in array v_fmt_list
      loop
        if not (v_fmt = any (v_formats)) then
          continue;
        end if;
        v_win_start := (v_day::timestamp + v_rule.start_time) at time zone 'Europe/Paris';
        v_win_end := (v_day::timestamp + v_rule.end_time) at time zone 'Europe/Paris';

        for v_exc in
          select *
          from public.care_availability_exceptions e
          where e.expert_id = p_expert_id and e.date = v_day and e.is_closed
        loop
          if v_exc.start_time is null and v_exc.end_time is null then
            v_win_start := v_win_end;
          else
            if v_win_start < ((v_day::timestamp + coalesce(v_exc.end_time, v_rule.end_time)) at time zone 'Europe/Paris')
               and v_win_end > ((v_day::timestamp + coalesce(v_exc.start_time, v_rule.start_time)) at time zone 'Europe/Paris')
            then
              if v_win_start >= ((v_day::timestamp + coalesce(v_exc.start_time, time '00:00')) at time zone 'Europe/Paris')
                 and v_win_end <= ((v_day::timestamp + coalesce(v_exc.end_time, time '23:59')) at time zone 'Europe/Paris')
              then
                v_win_start := v_win_end;
              elsif v_win_start < ((v_day::timestamp + coalesce(v_exc.start_time, time '00:00')) at time zone 'Europe/Paris') then
                v_win_end := least(v_win_end, (v_day::timestamp + coalesce(v_exc.start_time, time '00:00')) at time zone 'Europe/Paris');
              else
                v_win_start := greatest(v_win_start, (v_day::timestamp + coalesce(v_exc.end_time, time '23:59')) at time zone 'Europe/Paris');
              end if;
            end if;
          end if;
        end loop;

        v_cursor := v_win_start;
        while v_cursor + v_duration <= v_win_end loop
          v_end := v_cursor + v_duration;
          if v_cursor >= p_from
             and v_end <= p_to
             and v_cursor >= now() + interval '12 hours'
             and not exists (
               select 1
               from public.care_bookings b
               where b.expert_id = p_expert_id
                 and b.status = 'confirmed'
                 and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(v_cursor, v_end, '[)')
             )
          then
            starts_at := v_cursor;
            ends_at := v_end;
            format := v_fmt;
            return next;
          end if;
          v_cursor := v_cursor + v_duration;
        end loop;
      end loop;
    end loop;

    for v_exc in
      select *
      from public.care_availability_exceptions e
      where e.expert_id = p_expert_id and e.date = v_day and not e.is_closed
        and e.start_time is not null and e.end_time is not null
    loop
      foreach v_fmt in array v_formats
      loop
        v_win_start := (v_day::timestamp + v_exc.start_time) at time zone 'Europe/Paris';
        v_win_end := (v_day::timestamp + v_exc.end_time) at time zone 'Europe/Paris';
        v_cursor := v_win_start;
        while v_cursor + v_duration <= v_win_end loop
          v_end := v_cursor + v_duration;
          if v_cursor >= p_from
             and v_end <= p_to
             and v_cursor >= now() + interval '12 hours'
             and not exists (
               select 1
               from public.care_bookings b
               where b.expert_id = p_expert_id
                 and b.status = 'confirmed'
                 and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(v_cursor, v_end, '[)')
             )
          then
            starts_at := v_cursor;
            ends_at := v_end;
            format := v_fmt;
            return next;
          end if;
          v_cursor := v_cursor + v_duration;
        end loop;
      end loop;
    end loop;
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'care-avatars',
  'care-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read care avatars" on storage.objects;
create policy "Public read care avatars"
  on storage.objects for select
  using (bucket_id = 'care-avatars');

drop policy if exists "Care expert write own avatar" on storage.objects;
create policy "Care expert write own avatar"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'care-avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'care-avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

alter table public.care_profiles enable row level security;
alter table public.care_services enable row level security;
alter table public.care_experiences enable row level security;
alter table public.care_trainings enable row level security;
alter table public.care_availability_rules enable row level security;
alter table public.care_availability_exceptions enable row level security;
alter table public.care_bookings enable row level security;

drop policy if exists care_profiles_public_read on public.care_profiles;
create policy care_profiles_public_read
  on public.care_profiles for select
  using ((published and is_care) or expert_id = auth.uid());

drop policy if exists care_profiles_owner_write on public.care_profiles;
create policy care_profiles_owner_write
  on public.care_profiles for all
  to authenticated
  using (expert_id = auth.uid())
  with check (expert_id = auth.uid());

drop policy if exists care_services_public_read on public.care_services;
create policy care_services_public_read
  on public.care_services for select
  using (public.care_profile_is_public(expert_id) or expert_id = auth.uid());

drop policy if exists care_services_owner_write on public.care_services;
create policy care_services_owner_write
  on public.care_services for all
  to authenticated
  using (expert_id = auth.uid())
  with check (expert_id = auth.uid());

drop policy if exists care_experiences_public_read on public.care_experiences;
create policy care_experiences_public_read
  on public.care_experiences for select
  using (public.care_profile_is_public(expert_id) or expert_id = auth.uid());

drop policy if exists care_experiences_owner_write on public.care_experiences;
create policy care_experiences_owner_write
  on public.care_experiences for all
  to authenticated
  using (expert_id = auth.uid())
  with check (expert_id = auth.uid());

drop policy if exists care_trainings_public_read on public.care_trainings;
create policy care_trainings_public_read
  on public.care_trainings for select
  using (public.care_profile_is_public(expert_id) or expert_id = auth.uid());

drop policy if exists care_trainings_owner_write on public.care_trainings;
create policy care_trainings_owner_write
  on public.care_trainings for all
  to authenticated
  using (expert_id = auth.uid())
  with check (expert_id = auth.uid());

drop policy if exists care_rules_owner on public.care_availability_rules;
create policy care_rules_owner
  on public.care_availability_rules for all
  to authenticated
  using (expert_id = auth.uid())
  with check (expert_id = auth.uid());

drop policy if exists care_exceptions_owner on public.care_availability_exceptions;
create policy care_exceptions_owner
  on public.care_availability_exceptions for all
  to authenticated
  using (expert_id = auth.uid())
  with check (expert_id = auth.uid());

drop policy if exists care_bookings_expert_read on public.care_bookings;
create policy care_bookings_expert_read
  on public.care_bookings for select
  to authenticated
  using (expert_id = auth.uid());

drop policy if exists care_bookings_expert_update on public.care_bookings;
create policy care_bookings_expert_update
  on public.care_bookings for update
  to authenticated
  using (expert_id = auth.uid())
  with check (expert_id = auth.uid());

grant select on public.care_profiles, public.care_services, public.care_experiences, public.care_trainings
  to anon, authenticated;
grant select on public.care_directory, public.care_expert_badges to anon, authenticated;
grant insert, update, delete on public.care_profiles, public.care_services, public.care_experiences,
  public.care_trainings, public.care_availability_rules, public.care_availability_exceptions
  to authenticated;
grant select, update on public.care_bookings to authenticated;
grant execute on function public.get_available_slots(uuid, uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.get_care_booking_by_token(uuid, text) to anon, authenticated;
grant execute on function public.care_profile_is_public(uuid) to anon, authenticated;

-- Seed Jessica (compte existant) + Anaïs (démo, si insertion experts possible).
do $$
declare
  v_jessica uuid;
  v_anais uuid := 'c4e0a0a1-1111-4111-8111-0000000000a1';
begin
  select e.id into v_jessica
  from public.experts e
  where lower(e.email) = 'contentin.cabinet@gmail.com'
  limit 1;
  if v_jessica is null then
    select u.id into v_jessica
    from auth.users u
    where lower(u.email) = 'contentin.cabinet@gmail.com'
    limit 1;
  end if;

  if v_jessica is not null then
    insert into public.experts (id, email, first_name, last_name, is_care_expert, is_active, review_status)
    values (v_jessica, 'contentin.cabinet@gmail.com', 'Jessica', 'Contentin', true, true, 'approved')
    on conflict (id) do update set
      is_care_expert = true,
      is_active = true,
      review_status = 'approved';

    insert into public.care_profiles (
      expert_id, slug, published, is_care, display_name, title, tagline, headline, bio, approach,
      domains, publics, city, offers_cabinet, offers_visio, languages, payment_methods, member_since
    ) values (
      v_jessica,
      'jessica-contentin',
      true,
      true,
      'Jessica Contentin',
      'Psychopédagogue certifiée en neuroéducation',
      '[Tagline saisie par la praticienne]',
      '[Titre de présentation saisi par la praticienne]',
      '[Bio longue — approche, public, cadre de l''accompagnement.]',
      '[Approche — méthode, outils, déroulement d''un suivi.]',
      array['famille'::public.care_domain, 'carriere'::public.care_domain],
      array['Parents', 'Adolescents', 'Salariés'],
      'Caen',
      true,
      true,
      array['fr'],
      array['on_site', 'card'],
      date '2024-01-01'
    )
    on conflict (expert_id) do update set
      slug = excluded.slug,
      published = true,
      is_care = true,
      display_name = excluded.display_name,
      title = excluded.title,
      domains = excluded.domains,
      city = excluded.city,
      offers_cabinet = true,
      offers_visio = true;

    delete from public.care_services where expert_id = v_jessica;
    insert into public.care_services (expert_id, position, name, domain, description, duration_min, formats, price_cents, active) values
      (v_jessica, 1, '[Premier échange]', 'famille', '[Description du premier échange.]', 30, array['visio'::public.care_session_format], 0, true),
      (v_jessica, 2, '[Bilan Family]', 'famille', '[Description du bilan Family.]', 60, array['cabinet'::public.care_session_format, 'visio'::public.care_session_format], 0, true),
      (v_jessica, 3, '[Accompagnement Family]', 'famille', '[Description de l''accompagnement Family.]', 45, array['cabinet'::public.care_session_format, 'visio'::public.care_session_format], 0, true),
      (v_jessica, 4, '[Bilan Shift]', 'carriere', '[Description du bilan Shift.]', 60, array['visio'::public.care_session_format], 0, true);

    delete from public.care_experiences where expert_id = v_jessica;
    insert into public.care_experiences (expert_id, position, period_label, role, organization, description) values
      (v_jessica, 1, '[2021 — aujourd''hui]', '[Rôle]', '[Organisation]', '[Description.]'),
      (v_jessica, 2, '[2018 — 2021]', '[Rôle]', '[Organisation]', '[Description.]'),
      (v_jessica, 3, '[2015 — 2018]', '[Rôle]', '[Organisation]', '[Description.]');

    delete from public.care_trainings where expert_id = v_jessica;
    insert into public.care_trainings (expert_id, position, year, title, organization) values
      (v_jessica, 1, '[année]', '[Diplôme ou formation]', '[Établissement]'),
      (v_jessica, 2, '[année]', '[Certificat]', '[Établissement]'),
      (v_jessica, 3, '[année]', '[Formation courte]', '[Établissement]');

    delete from public.care_availability_rules where expert_id = v_jessica;
    insert into public.care_availability_rules (expert_id, position, weekday, start_time, end_time, format)
    select v_jessica, gs, gs, time '09:00', time '12:00', 'both'
    from generate_series(1, 5) gs;

    insert into public.expert_memberships (expert_id, pole, status, joined_at)
    values (v_jessica, 'care', 'active', now())
    on conflict (expert_id, pole) do update set status = 'active', joined_at = coalesce(public.expert_memberships.joined_at, now());
  else
    raise notice 'Seed Care : Jessica introuvable (contentin.cabinet@gmail.com).';
  end if;

  begin
    insert into public.experts (id, email, first_name, last_name, is_care_expert, is_active, review_status)
    values (v_anais, 'anais.care.demo@byound.fr', 'Anaïs', '', true, true, 'approved')
    on conflict (id) do update set
      first_name = 'Anaïs',
      is_care_expert = true,
      is_active = true;
  exception when others then
    select e.id into v_anais from public.experts e where lower(e.email) = 'anais.care.demo@byound.fr' limit 1;
    if v_anais is null then
      raise notice 'Seed Care : Anaïs non créée (%).', sqlerrm;
      return;
    end if;
  end;

  insert into public.care_profiles (
    expert_id, slug, published, is_care, display_name, title, tagline, headline, bio, approach,
    domains, publics, city, offers_cabinet, offers_visio, languages, payment_methods, member_since
  ) values (
    v_anais,
    'anais',
    true,
    true,
    'Anaïs',
    '[Nom]',
    '[Praticienne petite enfance 0–6 ans]',
    '',
    '',
    '',
    array['famille'::public.care_domain],
    array['0–3 ans'],
    '[Ville]',
    false,
    true,
    array['fr'],
    array['on_site'],
    current_date
  )
  on conflict (expert_id) do update set
    slug = 'anais',
    published = true,
    is_care = true,
    display_name = 'Anaïs',
    title = '[Nom]',
    domains = array['famille'::public.care_domain];

  delete from public.care_services where expert_id = v_anais;
  delete from public.care_experiences where expert_id = v_anais;
  delete from public.care_trainings where expert_id = v_anais;
  insert into public.care_services (expert_id, position, name, domain, description, duration_min, formats, price_cents, active)
  values (v_anais, 1, '[Séance]', 'famille', '', 45, array['visio'::public.care_session_format], 0, true);
end $$;

commit;
