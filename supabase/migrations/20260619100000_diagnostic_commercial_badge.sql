-- Open Badge « Diagnostic Commercial » (EDGE Lab / edgelab) — attribution programmatique.

do $$
declare
  v_org_id uuid;
  v_badge_id uuid := 'a1000001-0000-4000-8000-000000000001';
begin
  select o.id
  into v_org_id
  from public.organizations o
  where lower(coalesce(o.slug, '')) in ('edgelab', 'edge-lab')
  order by case when lower(o.slug) = 'edgelab' then 0 else 1 end
  limit 1;

  if v_org_id is null then
    raise notice 'diagnostic_commercial_badge: org edgelab introuvable, seed ignoré';
    return;
  end if;

  insert into public.open_badges (
    id,
    org_id,
    name,
    title,
    description,
    status,
    visible_in_learner_dashboard,
    requires_enrollment,
    image_url,
    evaluation_config
  )
  values (
    v_badge_id,
    v_org_id,
    'Diagnostic Commercial',
    'Diagnostic Commercial',
    'Validation du profil croisé DISC, IDMC et soft skills EDGE.',
    'active',
    false,
    false,
    '/edge-lab/open-badge-modern-prospecting.png',
    jsonb_build_object(
      'level', 1,
      'orgId', v_org_id::text,
      'criteria', jsonb_build_array(
        jsonb_build_object(
          'label', 'Profil croisé complet',
          'description', 'Compléter les tests DISC, IDMC et soft skills.'
        )
      ),
      'evaluationMethods', jsonb_build_array(),
      'learnerAwards', jsonb_build_object()
    )
  )
  on conflict (id) do update set
    org_id = excluded.org_id,
    name = excluded.name,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    image_url = excluded.image_url,
    updated_at = now();
end $$;
