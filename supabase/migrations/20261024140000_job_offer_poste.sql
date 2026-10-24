-- Étape « Le poste » : champs structurés, sans casser les offres existantes.
alter table public.job_offers
  add column if not exists work_mode text,
  add column if not exists contract_duration text,
  add column if not exists diploma_prepared text,
  add column if not exists alternance_school text,
  add column if not exists work_rhythm text,
  add column if not exists experience_level text,
  add column if not exists education_level text,
  add column if not exists requirements_folded boolean not null default false;

-- Seulement si la colonne requirements existe. Sinon ce script s'arrêtait en erreur
-- et aucune colonne n'était créée.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_offers'
      and column_name = 'requirements'
  ) then
    execute $upd$
      update public.job_offers
      set
        description = trim(both E'\n' from concat_ws(
          E'\n\n',
          nullif(trim(coalesce(description, '')), ''),
          nullif(trim(coalesce(requirements, '')), '')
        )),
        requirements_folded = true
      where requirements_folded = false
        and nullif(trim(coalesce(requirements, '')), '') is not null
        and position(trim(requirements) in coalesce(description, '')) = 0
    $upd$;
  end if;
end $$;
