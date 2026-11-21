-- Contrats d'alternance (pivot apprenant ↔ entreprise ↔ tuteur).
-- Créés côté staff / entreprise d'accueil — jamais par l'apprenant.
-- promotion_id = school_classes (promotion).

create table if not exists public.alternance_contracts (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.cfa_companies (id) on delete restrict,
  tutor_id uuid references public.profiles (id) on delete set null,
  company_tutor_id uuid references public.company_tutors (id) on delete set null,
  application_id uuid references public.cfa_applications (id) on delete set null,
  placement_id uuid references public.apprentice_placements (id) on delete set null,
  promotion_id uuid references public.school_classes (id) on delete set null,
  title text,
  start_date date,
  end_date date,
  status text not null default 'draft'
    check (status in ('draft', 'signed', 'active', 'ended', 'broken')),
  cerfa_document_id uuid,
  activated_at timestamptz,
  ended_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.alternance_contracts is
  'Contrat d''alternance actif = situation apprentice. Créé depuis la fiche entreprise d''accueil.';

create unique index if not exists alternance_contracts_one_active
  on public.alternance_contracts (apprentice_id)
  where status = 'active';

create index if not exists alternance_contracts_company_idx
  on public.alternance_contracts (company_id, status);

create index if not exists alternance_contracts_tutor_idx
  on public.alternance_contracts (tutor_id)
  where tutor_id is not null;

create index if not exists alternance_contracts_application_idx
  on public.alternance_contracts (application_id)
  where application_id is not null;

alter table public.alternance_contracts enable row level security;

-- Apprenant : lit ses propres contrats.
drop policy if exists alternance_contracts_apprentice_select on public.alternance_contracts;
create policy alternance_contracts_apprentice_select
  on public.alternance_contracts
  for select
  using (apprentice_id = auth.uid());

-- Tuteur : lit les contrats dont il est maître d'apprentissage.
drop policy if exists alternance_contracts_tutor_select on public.alternance_contracts;
create policy alternance_contracts_tutor_select
  on public.alternance_contracts
  for select
  using (tutor_id = auth.uid());

-- Entreprise (org liée à cfa_companies.organization_id) : lit les contrats de son entreprise.
drop policy if exists alternance_contracts_company_select on public.alternance_contracts;
create policy alternance_contracts_company_select
  on public.alternance_contracts
  for select
  using (
    exists (
      select 1
      from public.cfa_companies c
      join public.org_memberships om on om.org_id = c.organization_id
      where c.id = alternance_contracts.company_id
        and om.user_id = auth.uid()
        and lower(coalesce(om.role, '')) in ('admin', 'manager', 'rh', 'hr', 'owner')
    )
  );

-- Écritures : service role / staff via API uniquement (pas de policy insert/update pour authenticated).

-- Effets automatiques quand un contrat passe à active / ended / broken.
create or replace function public.alternance_contract_status_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tutor_user uuid;
begin
  new.updated_at := now();

  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    new.activated_at := coalesce(new.activated_at, now());
    new.ended_at := null;

    -- Situation apprenant (type_profil miroir ; la situation canonique est calculée côté serveur).
    update public.profiles
      set type_profil = 'alternance',
          placement_status = 'en_alternance'
      where id = new.apprentice_id;

    -- Entreprise d'accueil → Recrutement réussi.
    update public.cfa_companies
      set status = 'recruited'
      where id = new.company_id
        and coalesce(status, '') not in ('recruited', 'not_recruited');

    -- Sync tutor_assignments si tuteur connu.
    tutor_user := new.tutor_id;
    if tutor_user is null and new.company_tutor_id is not null then
      select user_id into tutor_user
      from public.company_tutors
      where id = new.company_tutor_id;
      if tutor_user is not null then
        new.tutor_id := tutor_user;
      end if;
    end if;

    if tutor_user is not null then
      update public.tutor_assignments
        set status = 'ended', ended_at = now()
        where learner_id = new.apprentice_id
          and status = 'active'
          and tutor_id is distinct from tutor_user;

      update public.tutor_assignments
        set status = 'active', ended_at = null
        where tutor_id = tutor_user
          and learner_id = new.apprentice_id
          and organization_id is null;

      insert into public.tutor_assignments (tutor_id, learner_id, status, started_at)
      select tutor_user, new.apprentice_id, 'active', now()
      where not exists (
        select 1 from public.tutor_assignments
        where tutor_id = tutor_user
          and learner_id = new.apprentice_id
          and organization_id is null
      );
    end if;
  end if;

  if new.status in ('ended', 'broken') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    new.ended_at := coalesce(new.ended_at, now());

    update public.tutor_assignments
      set status = 'ended', ended_at = coalesce(new.ended_at, now())
      where learner_id = new.apprentice_id
        and status = 'active'
        and (new.tutor_id is null or tutor_id = new.tutor_id);

    -- Ne force pas type_profil : l'historique reste ; la situation calculée redevient learner/candidate.
    update public.profiles
      set placement_status = case
        when placement_status = 'en_alternance' then 'recherche_alternance'
        else placement_status
      end
      where id = new.apprentice_id;
  end if;

  return new;
end;
$$;

drop trigger if exists alternance_contracts_status_effects on public.alternance_contracts;
create trigger alternance_contracts_status_effects
  before insert or update of status, tutor_id, company_tutor_id, apprentice_id, company_id
  on public.alternance_contracts
  for each row execute function public.alternance_contract_status_effects();

-- Backfill depuis les placements actifs déjà liés à un compte apprenant.
insert into public.alternance_contracts (
  apprentice_id,
  company_id,
  tutor_id,
  company_tutor_id,
  application_id,
  placement_id,
  status,
  start_date,
  activated_at,
  created_at
)
select
  a.profile_id,
  p.company_id,
  ct.user_id,
  p.tutor_id,
  p.apprentice_id,
  p.id,
  'active',
  coalesce(p.started_at::date, current_date),
  coalesce(p.started_at, now()),
  coalesce(p.created_at, now())
from public.apprentice_placements p
join public.cfa_applications a on a.id = p.apprentice_id
left join public.company_tutors ct on ct.id = p.tutor_id
where p.status = 'active'
  and a.profile_id is not null
  and not exists (
    select 1 from public.alternance_contracts c
    where c.apprentice_id = a.profile_id and c.status = 'active'
  );
