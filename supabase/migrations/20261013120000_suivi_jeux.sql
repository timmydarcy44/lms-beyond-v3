-- =====================================================================
-- Suivi des jeux interactifs : parties, réponses, sauvegardes, livrables
-- Apprenant : voit ses propres données. École (formateurs, admins) : voit ses apprenants.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. ADAPTATEUR ÉCOLE : la seule partie à adapter au modèle de Beyond.
--    Par défaut, on suppose une table organization_members(organization_id, user_id, role).
--    Remplacez le nom de la table, des colonnes et des rôles par ceux de Beyond.
-- ---------------------------------------------------------------------
create or replace function public.sg_staff_orgs()
returns setof uuid language sql stable security definer set search_path = public as $$
  select org_id from public.org_memberships
  where user_id = auth.uid() and role in ('admin', 'instructor', 'formateur', 'tutor', 'owner', 'staff');
$$;

create or replace function public.sg_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sg_staff_orgs());
$$;

-- Un membre de l'équipe pédagogique voit les apprenants de ses organisations
create or replace function public.sg_can_view_learner(learner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_memberships m
    where m.user_id = learner and m.org_id in (select public.sg_staff_orgs())
  );
$$;

-- Nom affiché d'un apprenant (uniquement pour lui-même ou pour son école)
create or replace function public.sg_learner_label(learner uuid)
returns text language sql stable security definer set search_path = public, auth as $$
  select case when learner = auth.uid() or public.sg_can_view_learner(learner)
    then coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email) end
  from auth.users u where u.id = learner;
$$;

-- ---------------------------------------------------------------------
-- 1. Jeux importés (une ligne par version de paquet)
-- ---------------------------------------------------------------------
create table if not exists public.serious_games (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,               -- jeu.json : id
  version     int  not null default 1,     -- jeu.json : version
  title       text not null,
  manifest    jsonb not null,              -- contenu complet de jeu.json
  entry_url   text,                        -- URL publique de index.html après import
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  unique (slug, version)
);
alter table public.serious_games enable row level security;
create policy "sg_games_read" on public.serious_games for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- 2. Parties (créées par le kit précédent ; on complète les colonnes)
-- ---------------------------------------------------------------------
create table if not exists public.serious_game_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  game_version int not null default 1,
  status text not null default 'started' check (status in ('started', 'completed')),
  steps_count int not null default 0,
  ending text, ending_title text, ending_text text, lesson text,
  tone text check (tone in ('good', 'mid', 'bad')),
  score int check (score between 0 and 100),
  satisfaction numeric(5,2), ambiance numeric(5,2), cost numeric(6,2), endings_found int,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.serious_game_attempts
  add column if not exists course_id    text,
  add column if not exists lesson_id    text,
  add column if not exists block_id     text,
  add column if not exists passed       boolean,
  add column if not exists criteria     jsonb,      -- sous-notes (ex. sources, analyse…)
  add column if not exists xp           int,
  add column if not exists badges       jsonb not null default '[]'::jsonb,
  add column if not exists duration_sec int,
  add column if not exists report       jsonb,      -- contenu du livrable (fiche d'analyse…)
  add column if not exists pdf_path     text;       -- chemin du PDF dans le stockage

-- Une partie terminée est figée : seul le lien vers le PDF peut encore être ajouté
create or replace function public.sg_freeze_completed()
returns trigger language plpgsql as $$
declare pdf text := new.pdf_path;
begin
  if old.status = 'completed' then
    new := old;
    new.pdf_path := coalesce(pdf, old.pdf_path);
  end if;
  return new;
end $$;
create index if not exists sga_user_idx  on public.serious_game_attempts (user_id, game_id, started_at desc);
create index if not exists sga_block_idx on public.serious_game_attempts (block_id, user_id, started_at desc);
create index if not exists sga_game_idx  on public.serious_game_attempts (game_id, status, completed_at desc);

alter table public.serious_game_attempts enable row level security;
drop policy if exists "sga_select_own" on public.serious_game_attempts;
drop policy if exists "sga_insert_own" on public.serious_game_attempts;
drop policy if exists "sga_update_own" on public.serious_game_attempts;
create policy "sga_select" on public.serious_game_attempts for select
  using (auth.uid() = user_id or public.sg_can_view_learner(user_id));
create policy "sga_insert_own" on public.serious_game_attempts for insert with check (auth.uid() = user_id);
create policy "sga_update_own" on public.serious_game_attempts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Réponses, question par question
-- ---------------------------------------------------------------------
create table if not exists public.serious_game_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.serious_game_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  step_index int not null check (step_index between 1 and 30),
  node_id text not null,
  situation text, speaker text, question text not null, tension int,
  options jsonb not null default '[]'::jsonb,
  chosen_key text not null, chosen_text text not null,
  tone text check (tone in ('good', 'mid', 'bad')),
  concept text, feedback text, delta jsonb, gauges jsonb,
  answered_at timestamptz not null default now(),
  unique (attempt_id, step_index)
);
alter table public.serious_game_answers
  add column if not exists chosen_keys text[],   -- choix multiples (sources retenues, informations classées…)
  add column if not exists free_text   text;     -- réponse rédigée

create index if not exists sgans_attempt_idx on public.serious_game_answers (attempt_id, step_index);
create index if not exists sgans_stats_idx   on public.serious_game_answers (game_id, node_id, tone);

alter table public.serious_game_answers enable row level security;
drop policy if exists "sgans_select_own" on public.serious_game_answers;
drop policy if exists "sgans_insert_own" on public.serious_game_answers;
create policy "sgans_select" on public.serious_game_answers for select
  using (auth.uid() = user_id or public.sg_can_view_learner(user_id));
create policy "sgans_insert_own" on public.serious_game_answers for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.serious_game_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 4. Sauvegarde en cours (reprise de partie) et collection (badges du jeu)
-- ---------------------------------------------------------------------
create table if not exists public.serious_game_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  block_id text not null,
  game_id text not null,
  current_attempt_id uuid references public.serious_game_attempts(id) on delete set null,
  state jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, block_id)
);
alter table public.serious_game_saves enable row level security;
create policy "sgs_own" on public.serious_game_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.serious_game_collections (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  collection jsonb not null default '{}'::jsonb,   -- { badges: [...], best: n, runs: n }
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);
alter table public.serious_game_collections enable row level security;
create policy "sgc_select" on public.serious_game_collections for select
  using (auth.uid() = user_id or public.sg_can_view_learner(user_id));
create policy "sgc_write_own" on public.serious_game_collections for insert with check (auth.uid() = user_id);
create policy "sgc_update_own" on public.serious_game_collections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. Livrables PDF : bucket privé, un dossier par apprenant
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('serious-game-deliverables', 'serious-game-deliverables', false)
on conflict (id) do nothing;

create policy "sgd_read" on storage.objects for select using (
  bucket_id = 'serious-game-deliverables' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.sg_can_view_learner(((storage.foldername(name))[1])::uuid)));
create policy "sgd_write_own" on storage.objects for insert with check (
  bucket_id = 'serious-game-deliverables' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sgd_update_own" on storage.objects for update using (
  bucket_id = 'serious-game-deliverables' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 6. Vues de synthèse (elles appliquent les droits de la personne qui lit)
-- ---------------------------------------------------------------------
drop trigger if exists sga_freeze on public.serious_game_attempts;
create trigger sga_freeze before update on public.serious_game_attempts
  for each row execute function public.sg_freeze_completed();

create or replace view public.sg_learner_game_summary with (security_invoker = true) as
select user_id, game_id,
  count(*) filter (where status = 'completed')                    as completed_count,
  max(score)                                                      as best_score,
  round(avg(score) filter (where status = 'completed'))::int      as avg_score,
  bool_or(passed)                                                 as ever_passed,
  max(xp)                                                         as best_xp,
  max(completed_at)                                               as last_completed_at,
  min(started_at)                                                 as first_started_at
from public.serious_game_attempts
group by user_id, game_id;

-- Où les apprenants se trompent : répartition des évaluations par question
create or replace view public.sg_question_stats with (security_invoker = true) as
select game_id, node_id, min(question) as question,
  count(*)                                   as answers,
  count(*) filter (where tone = 'good')      as good,
  count(*) filter (where tone = 'mid')       as mid,
  count(*) filter (where tone = 'bad')       as bad
from public.serious_game_answers
group by game_id, node_id;

grant select, insert, update, delete on
  public.serious_games,
  public.serious_game_attempts,
  public.serious_game_answers,
  public.serious_game_saves,
  public.serious_game_collections
to authenticated;

grant select on public.sg_learner_game_summary, public.sg_question_stats to authenticated;

grant execute on function public.sg_staff_orgs() to authenticated;
grant execute on function public.sg_is_staff() to authenticated;
grant execute on function public.sg_can_view_learner(uuid) to authenticated;
grant execute on function public.sg_learner_label(uuid) to authenticated;
