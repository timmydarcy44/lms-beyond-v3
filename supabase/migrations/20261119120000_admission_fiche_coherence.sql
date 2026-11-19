-- Fiche candidat : entretien réalisé, RQTH contrat hors candidature, frais par parcours.

alter table public.cfa_applications
  add column if not exists interview_realized_at timestamptz;

comment on column public.cfa_applications.interview_realized_at is
  'Horodatage de l’entretien d’admission marqué réalisé. Requis avant le statut review (Décision).';

-- RQTH pour CERFA — table séparée, jamais exposée au jury via cfa_applications.
create table if not exists public.admission_contract_rqth (
  application_id uuid primary key references public.cfa_applications(id) on delete cascade,
  rqth text check (rqth is null or rqth in ('yes', 'no', 'unknown')),
  source text check (source is null or source in ('handicap_space', 'manual', 'candidate')),
  consent_for_contract boolean not null default false,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admission_contract_rqth enable row level security;

drop policy if exists admission_contract_rqth_select on public.admission_contract_rqth;
create policy admission_contract_rqth_select on public.admission_contract_rqth
  for select using (
    public.user_has_role(auth.uid(), array['super_admin', 'admin'])
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role, '')) in ('super_admin', 'handicap_referent', 'referent_handicap', 'contract_manager', 'gestionnaire_contrats')
          or lower(coalesce(p.role_type, '')) in ('handicap_referent', 'referent_handicap', 'contract_manager', 'gestionnaire_contrats')
        )
    )
  );

drop policy if exists admission_contract_rqth_write on public.admission_contract_rqth;
create policy admission_contract_rqth_write on public.admission_contract_rqth
  for all using (
    public.user_has_role(auth.uid(), array['super_admin', 'admin'])
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role, '')) in ('super_admin', 'handicap_referent', 'referent_handicap', 'contract_manager', 'gestionnaire_contrats')
          or lower(coalesce(p.role_type, '')) in ('handicap_referent', 'referent_handicap', 'contract_manager', 'gestionnaire_contrats')
        )
    )
  )
  with check (
    public.user_has_role(auth.uid(), array['super_admin', 'admin'])
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role, '')) in ('super_admin', 'handicap_referent', 'referent_handicap', 'contract_manager', 'gestionnaire_contrats')
          or lower(coalesce(p.role_type, '')) in ('handicap_referent', 'referent_handicap', 'contract_manager', 'gestionnaire_contrats')
        )
    )
  );

-- Config frais d’inscription par type de parcours (désactivé par défaut pour l’apprentissage).
create table if not exists public.admission_fee_settings (
  financing_path text primary key check (financing_path in ('alternance', 'byound_start', 'other')),
  fees_applicable boolean not null default false,
  amount_cents integer not null default 25000,
  updated_at timestamptz not null default now()
);

insert into public.admission_fee_settings (financing_path, fees_applicable, amount_cents)
values
  ('alternance', false, 25000),
  ('byound_start', true, 25000),
  ('other', false, 25000)
on conflict (financing_path) do nothing;

alter table public.admission_fee_settings enable row level security;

drop policy if exists admission_fee_settings_admin on public.admission_fee_settings;
create policy admission_fee_settings_admin on public.admission_fee_settings
  for all using (public.user_has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.user_has_role(auth.uid(), array['super_admin', 'admin']));
