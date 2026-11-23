-- Traçabilité validation client (lien mail vs saisie manuelle RP) + Jessica RP.
-- Réversible : colonnes nullable ; reset ciblé des dates non tracées.

alter table public.organization_need_analyses
  add column if not exists client_validation_source text;

alter table public.organization_need_analyses
  add column if not exists client_validation_proof text;

alter table public.organization_need_analyses
  add column if not exists client_validated_by_email text;

alter table public.organization_need_analyses
  add column if not exists client_validated_ip text;

alter table public.organization_need_analyses
  add column if not exists client_validated_at_ts timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_need_analyses_client_validation_source_check'
  ) then
    alter table public.organization_need_analyses
      add constraint organization_need_analyses_client_validation_source_check
      check (
        client_validation_source is null
        or client_validation_source in ('link', 'manual')
      );
  end if;
end $$;

comment on column public.organization_need_analyses.client_validation_source is
  'link = clic lien mail client ; manual = saisie RP avec preuve';
comment on column public.organization_need_analyses.client_validation_proof is
  'Preuve obligatoire si source = manual (réf. mail, PJ…)';
comment on column public.organization_need_analyses.client_validated_by_email is
  'Email du validateur (lien) ou de l’interlocuteur';
comment on column public.organization_need_analyses.client_validated_ip is
  'IP du clic de validation client (lien)';
comment on column public.organization_need_analyses.client_validated_at_ts is
  'Horodatage serveur de la validation client';

-- Remettre à null toute date client enregistrée sans source tracée (lien ou manuel).
update public.organization_need_analyses
set
  client_validated_at = null,
  client_validated_at_ts = null,
  client_validated_by_email = null,
  client_validated_ip = null,
  client_validation_proof = null
where client_validated_at is not null
  and (client_validation_source is null or client_validation_source not in ('link', 'manual'));

-- Jessica Contentin (super_admin) = Responsable pédagogique
update public.profiles
set is_pedagogical_manager = true
where id = 'fcdc770d-4474-43ae-97d6-e70ef7e58779';
