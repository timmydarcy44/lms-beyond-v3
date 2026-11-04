-- Fiche unique entreprise. N'efface, ne fusionne et ne modifie aucune organisation,
-- entreprise d'accueil ou ligne de pipeline. Les liens sont ajoutés.
-- À coller dans l'éditeur SQL Supabase.

begin;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  sector text,
  naf_code text,
  opco text,
  siret text,
  role_business boolean not null default false,
  role_cfa boolean not null default false,
  organization_id uuid,
  cfa_company_id uuid,
  owner_email text,
  is_demo boolean not null default false,
  merged_into uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  source_type text not null check (source_type in ('organization', 'cfa_company', 'deal')),
  source_id uuid not null,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create index if not exists companies_merged_idx on public.companies (merged_into);
create index if not exists company_sources_company_idx on public.company_sources (company_id);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_pipeline_deals' and column_name = 'company_id'
  ) then
    alter table public.crm_pipeline_deals
      add column company_id uuid references public.companies (id) on delete set null;
  end if;
exception
  when undefined_table then null;
end $$;

alter table public.companies enable row level security;
alter table public.company_sources enable row level security;

drop policy if exists companies_super on public.companies;
create policy companies_super on public.companies
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

drop policy if exists company_sources_super on public.company_sources;
create policy company_sources_super on public.company_sources
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

grant select, insert, update, delete on public.companies to service_role;
grant select, insert, update, delete on public.company_sources to service_role;

-- Rattache les fiches existantes. Une ligne source = une fiche.
-- Le même SIRET sur deux tables reste deux fiches, proposées ensuite dans Doublons.
do $$
declare
  org record;
  cfa record;
  deal record;
  new_id uuid;
  linked_id uuid;
  siret_val text;
  demo boolean;
  city_val text;
  sector_val text;
  naf_val text;
  opco_val text;
  owner_val text;
  business_role boolean;
  cfa_role boolean;
  same_siret int;
begin
  if to_regclass('public.organizations') is not null then
    for org in select * from public.organizations loop
      if exists (
        select 1 from public.company_sources
        where source_type = 'organization' and source_id = org.id
      ) then
        continue;
      end if;
      demo := coalesce(org.slug, '') in (
        'edge-business-demo', 'edge-demo-rh-aw78', 'edge-lab',
        'entreprise-de-test-yw9p', 'lalaland-s3eb', 'test03-xapi', 'timdada'
      );
      begin
        demo := demo or coalesce(org.kind, '') = 'demo';
      exception when undefined_column then
        null;
      end;
      siret_val := null;
      begin
        siret_val := nullif(regexp_replace(coalesce(org.siret, ''), '\s', '', 'g'), '');
      exception when undefined_column then
        siret_val := null;
      end;
      insert into public.companies (name, siret, role_business, organization_id, is_demo)
      values (coalesce(nullif(btrim(org.name), ''), 'Sans nom'), siret_val, true, org.id, demo)
      returning id into new_id;
      insert into public.company_sources (company_id, source_type, source_id)
      values (new_id, 'organization', org.id);
    end loop;
  end if;

  if to_regclass('public.cfa_companies') is not null then
    for cfa in select * from public.cfa_companies loop
      if exists (
        select 1 from public.company_sources
        where source_type = 'cfa_company' and source_id = cfa.id
      ) then
        continue;
      end if;
      siret_val := null;
      city_val := null;
      naf_val := null;
      sector_val := null;
      opco_val := null;
      begin
        siret_val := nullif(regexp_replace(coalesce(cfa.siret, ''), '\s', '', 'g'), '');
      exception when undefined_column then null;
      end;
      begin
        city_val := nullif(btrim(cfa.city), '');
      exception when undefined_column then null;
      end;
      begin
        naf_val := nullif(btrim(cfa.naf_code), '');
        sector_val := nullif(btrim(cfa.naf_label), '');
      exception when undefined_column then null;
      end;
      begin
        opco_val := nullif(btrim(cfa.opco), '');
      exception when undefined_column then null;
      end;
      insert into public.companies (name, city, sector, naf_code, opco, siret, role_cfa, cfa_company_id)
      values (
        coalesce(nullif(btrim(cfa.company_name), ''), 'Sans nom'),
        city_val, sector_val, naf_val, opco_val, siret_val, true, cfa.id
      )
      returning id into new_id;
      insert into public.company_sources (company_id, source_type, source_id)
      values (new_id, 'cfa_company', cfa.id);
    end loop;
  end if;

  if to_regclass('public.crm_pipeline_deals') is not null then
    for deal in select * from public.crm_pipeline_deals loop
      begin
        if coalesce(deal.pipeline_type, 'btob') = 'btoc' then
          continue;
        end if;
      exception when undefined_column then
        null;
      end;
      siret_val := null;
      city_val := null;
      sector_val := null;
      naf_val := null;
      opco_val := null;
      owner_val := null;
      business_role := true;
      cfa_role := false;
      begin
        siret_val := nullif(regexp_replace(coalesce(deal.siret, ''), '\s', '', 'g'), '');
      exception when undefined_column then null;
      end;
      begin
        city_val := nullif(btrim(deal.city), '');
      exception when undefined_column then null;
      end;
      begin
        sector_val := nullif(btrim(deal.sector), '');
        naf_val := nullif(btrim(deal.naf_code), '');
        opco_val := nullif(btrim(deal.opco_name), '');
        owner_val := nullif(btrim(deal.contact_owner_email), '');
      exception when undefined_column then null;
      end;
      begin
        business_role := deal.offers_business is distinct from false;
        cfa_role := deal.offers_school is true;
      exception when undefined_column then null;
      end;

      linked_id := null;
      begin
        if deal.organization_id is not null then
          select company_id into linked_id
          from public.company_sources
          where source_type = 'organization' and source_id = deal.organization_id
          limit 1;
        end if;
      exception when undefined_column then
        linked_id := null;
      end;

      if linked_id is null and siret_val is not null then
        select count(*) into same_siret from public.companies
        where merged_into is null and siret = siret_val;
        if same_siret = 1 then
          select id into linked_id from public.companies
          where merged_into is null and siret = siret_val
          limit 1;
        end if;
      end if;

      if linked_id is not null then
        update public.companies
        set
          role_business = role_business or business_role,
          role_cfa = role_cfa or cfa_role,
          city = coalesce(city, city_val),
          sector = coalesce(sector, sector_val),
          naf_code = coalesce(naf_code, naf_val),
          opco = coalesce(opco, opco_val),
          owner_email = coalesce(owner_email, owner_val),
          updated_at = now()
        where id = linked_id;
        begin
          if deal.company_id is null then
            update public.crm_pipeline_deals set company_id = linked_id where id = deal.id;
          end if;
        exception when undefined_column then null;
        end;
        if not exists (
          select 1 from public.company_sources
          where source_type = 'deal' and source_id = deal.id
        ) then
          insert into public.company_sources (company_id, source_type, source_id)
          values (linked_id, 'deal', deal.id);
        end if;
        continue;
      end if;

      if exists (
        select 1 from public.company_sources
        where source_type = 'deal' and source_id = deal.id
      ) then
        continue;
      end if;

      insert into public.companies (
        name, city, sector, naf_code, opco, siret, role_business, role_cfa, owner_email
      ) values (
        coalesce(nullif(btrim(deal.company_name), ''), 'Sans nom'),
        city_val, sector_val, naf_val, opco_val, siret_val, business_role, cfa_role, owner_val
      )
      returning id into new_id;
      insert into public.company_sources (company_id, source_type, source_id)
      values (new_id, 'deal', deal.id);
      begin
        update public.crm_pipeline_deals set company_id = new_id where id = deal.id;
      exception when undefined_column then null;
      end;
    end loop;
  end if;
end $$;

commit;
