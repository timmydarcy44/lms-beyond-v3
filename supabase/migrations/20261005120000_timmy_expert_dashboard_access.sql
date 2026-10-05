-- Accès cockpit expert pour timmydarcy44@gmail.com (profil expert approuvé).

do $$
declare
  v_user_id uuid;
  v_email text := 'timmydarcy44@gmail.com';
begin
  select id into v_user_id from auth.users where lower(email) = lower(v_email) limit 1;
  if v_user_id is null then
    raise notice 'timmy expert access: user % introuvable', v_email;
    return;
  end if;

  insert into public.experts (
    id,
    email,
    first_name,
    last_name,
    review_status,
    is_active,
    registration_step
  )
  select
    p.id,
    coalesce(p.email, v_email),
    p.first_name,
    p.last_name,
    'approved',
    true,
    1
  from public.profiles p
  where p.id = v_user_id
  on conflict (id) do update set
    email = excluded.email,
    review_status = 'approved',
    is_active = true;
end $$;
