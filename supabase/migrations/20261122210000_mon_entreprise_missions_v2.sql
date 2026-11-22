-- Mon entreprise v2 : statuts canoniques + skill_id + preuves multi-fichiers / liens
-- IMPORTANT : dropper la contrainte status AVANT le remap (sinon 23514 sur v2_chk).

-- 1) Colonnes
alter table public.tutor_missions
  add column if not exists skill_id uuid references public.skills(id) on delete set null,
  add column if not exists proof_links jsonb not null default '[]'::jsonb,
  add column if not exists proof_files jsonb not null default '[]'::jsonb,
  add column if not exists tutor_opened_at timestamptz,
  add column if not exists invalidation_reason text;

comment on column public.tutor_missions.skill_id is
  'Compétence du référentiel skills liée à la mission (nullable).';
comment on column public.tutor_missions.proof_links is
  'Liens de preuve [{url, label?}].';
comment on column public.tutor_missions.proof_files is
  'Fichiers de preuve privés [{path, name, size, mime}].';
comment on column public.tutor_missions.tutor_opened_at is
  'Premier ouverture de la preuve par le tuteur (bloque le retrait d''envoi).';

-- 2) Drop ALL status check constraints first
do $$
declare constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.tutor_missions'::regclass
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%status%'
        or con.conname ilike '%status%'
      )
  loop
    execute format('alter table public.tutor_missions drop constraint %I', constraint_name);
  end loop;
end $$;

-- 3) Remap statuts → assigned | submitted | changes_requested | validated
update public.tutor_missions
set status = 'assigned'
where status in ('todo', 'in_progress');

update public.tutor_missions
set status = 'changes_requested'
where status in ('correction_requested', 'invalid');

update public.tutor_missions
set status = 'validated'
where status = 'done';

update public.tutor_missions
set status = 'assigned'
where status = 'submitted'
  and (
    learner_note is null
    or length(trim(learner_note)) < 20
  )
  and (
    proof_url is null
    or trim(proof_url) = ''
  )
  and (
    proof_files is null
    or jsonb_typeof(proof_files) <> 'array'
    or jsonb_array_length(proof_files) = 0
  )
  and (
    proof_links is null
    or jsonb_typeof(proof_links) <> 'array'
    or jsonb_array_length(proof_links) = 0
  );

-- 4) New constraint (legacy values still allowed for safety)
alter table public.tutor_missions
  drop constraint if exists tutor_missions_status_v3_chk;

alter table public.tutor_missions
  add constraint tutor_missions_status_v3_chk
  check (status in (
    'assigned',
    'submitted',
    'changes_requested',
    'validated',
    'todo', 'in_progress', 'done', 'invalid', 'correction_requested'
  ));

create index if not exists tutor_missions_skill_idx
  on public.tutor_missions (skill_id)
  where skill_id is not null;

-- 5) Bucket privé pour les preuves
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('tutor-mission-proofs', 'tutor-mission-proofs', false, 20971520)
    on conflict (id) do update set public = false, file_size_limit = 20971520;
  end if;
end $$;
