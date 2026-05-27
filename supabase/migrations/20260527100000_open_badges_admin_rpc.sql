-- Open Badges admin : écriture via RPC Supabase (pas de DATABASE_URL côté Next.js)
--
-- OPTIONNEL (stack Prisma « BadgeClass »). Si vous avez public.open_badges, utilisez plutôt :
--   20260527130000_open_badges_admin_columns.sql
-- Puis seulement si vous utilisez Prisma + DATABASE_URL :
--   1) 20260527110000_open_badges_prisma_schema.sql
--   2) ce fichier (RPC)

CREATE OR REPLACE FUNCTION public.lms_ensure_openbadges_org(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_slug text;
BEGIN
  IF EXISTS (SELECT 1 FROM "Organization" o WHERE o.id = p_org_id) THEN
    RETURN;
  END IF;

  SELECT o.name, o.slug INTO v_name, v_slug
  FROM public.organizations o
  WHERE o.id = p_org_id;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'ORG_NOT_FOUND';
  END IF;

  INSERT INTO "Organization" (id, name, slug, "createdAt")
  VALUES (p_org_id, v_name, COALESCE(NULLIF(trim(v_slug), ''), p_org_id::text), now());
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_ensure_openbadges_user(p_user_id uuid, p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  PERFORM public.lms_ensure_openbadges_org(p_org_id);

  IF EXISTS (SELECT 1 FROM "User" u WHERE u.id = p_user_id) THEN
    RETURN;
  END IF;

  SELECT COALESCE(NULLIF(trim(p.email), ''), p_user_id::text || '@beyond.local')
  INTO v_email
  FROM public.profiles p
  WHERE p.id = p_user_id;

  IF v_email IS NULL THEN
    v_email := p_user_id::text || '@beyond.local';
  END IF;

  INSERT INTO "User" (id, "orgId", email, role, "createdAt")
  VALUES (p_user_id, p_org_id, v_email, 'SUPER_ADMIN'::"UserRole", now())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_resolve_issuer_for_org(
  p_org_id uuid,
  p_base_url text DEFAULT 'http://localhost:3001'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org record;
  v_issuer_id uuid;
  v_url text;
  v_email text;
  v_host text;
BEGIN
  PERFORM public.lms_ensure_openbadges_org(p_org_id);

  SELECT id, name, slug INTO v_org FROM "Organization" WHERE id = p_org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORG_NOT_FOUND';
  END IF;

  SELECT ip.id INTO v_issuer_id
  FROM "IssuerProfile" ip
  WHERE ip."orgId" = p_org_id
  ORDER BY ip."createdAt" ASC
  LIMIT 1;

  IF v_issuer_id IS NOT NULL THEN
    RETURN v_issuer_id;
  END IF;

  v_host := 'localhost';
  BEGIN
    v_host := COALESCE(NULLIF(split_part(replace(p_base_url, 'https://', ''), '/', 1), ''), 'localhost');
  EXCEPTION WHEN OTHERS THEN
    v_host := 'localhost';
  END;

  v_url := CASE
    WHEN v_org.slug IS NOT NULL AND trim(v_org.slug) <> '' THEN
      rtrim(p_base_url, '/') || '/organizations/' || v_org.slug
    ELSE rtrim(p_base_url, '/')
  END;
  v_email := 'no-reply@' || v_host;

  INSERT INTO "IssuerProfile" (id, "orgId", name, url, email, description, "imageUrl", "createdAt")
  VALUES (
    gen_random_uuid(),
    p_org_id,
    COALESCE(NULLIF(trim(v_org.name), ''), 'Organisation'),
    v_url,
    v_email,
    'Émetteur officiel de ' || COALESCE(v_org.name, 'Organisation'),
    rtrim(p_base_url, '/') || '/images/issuer-default.png',
    now()
  )
  RETURNING id INTO v_issuer_id;

  RETURN v_issuer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_admin_create_badge_class(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_issuer_id uuid;
  v_badge_id uuid;
  v_base_url text;
  v_requires_enrollment boolean;
  v_visible boolean;
  v_criteria_url text;
  v_row "BadgeClass"%ROWTYPE;
  c jsonb;
  v_sort int;
BEGIN
  v_org_id := (p_payload->>'orgId')::uuid;
  v_user_id := (p_payload->>'createdByUserId')::uuid;
  v_base_url := COALESCE(NULLIF(p_payload->>'baseUrl', ''), 'http://localhost:3001');

  IF v_org_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: orgId et createdByUserId requis';
  END IF;

  PERFORM public.lms_ensure_openbadges_user(v_user_id, v_org_id);
  v_issuer_id := public.lms_resolve_issuer_for_org(v_org_id, v_base_url);

  v_requires_enrollment := COALESCE((p_payload->>'requiresEnrollment')::boolean, false);
  v_visible := CASE
    WHEN v_requires_enrollment THEN false
    ELSE COALESCE((p_payload->>'visibleInLearnerDashboard')::boolean, false)
  END;

  v_criteria_url := NULLIF(p_payload->>'criteriaUrl', '');

  INSERT INTO "BadgeClass" (
    id,
    "orgId",
    "issuerId",
    "createdByUserId",
    name,
    description,
    "imageTemplateUrl",
    "imageUrl",
    "criteriaUrl",
    "criteriaText",
    "criteriaMarkdown",
    alignment,
    tags,
    version,
    status,
    "receivabilityReviewMode",
    "requiresEnrollment",
    "requiredCourseId",
    "visibleInLearnerDashboard",
    level,
    "evaluationMethods",
    "validatorExpertId",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    v_org_id,
    v_issuer_id,
    v_user_id,
    p_payload->>'name',
    p_payload->>'description',
    COALESCE(NULLIF(p_payload->>'imageUrl', ''), NULLIF(p_payload->>'imageTemplateUrl', ''), ''),
    NULLIF(p_payload->>'imageUrl', ''),
    v_criteria_url,
    NULLIF(p_payload->>'criteriaText', ''),
    NULLIF(p_payload->>'criteriaMarkdown', ''),
    COALESCE(p_payload->'alignment', 'null'::jsonb),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'tags', '[]'::jsonb))),
      '{}'::text[]
    ),
    COALESCE((p_payload->>'version')::int, 1),
    COALESCE((p_payload->>'status')::"BadgeClassStatus", 'DRAFT'::"BadgeClassStatus"),
    COALESCE((p_payload->>'receivabilityReviewMode')::"ReceivabilityReviewMode", 'HUMAN'::"ReceivabilityReviewMode"),
    v_requires_enrollment,
    CASE WHEN v_requires_enrollment THEN NULLIF(p_payload->>'requiredCourseId', '') ELSE NULL END,
    v_visible,
    NULLIF(p_payload->>'level', '')::int,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'evaluationMethods', '[]'::jsonb))),
      '{}'::text[]
    ),
    NULLIF(p_payload->>'validatorExpertId', ''),
    now(),
    now()
  )
  RETURNING * INTO v_row;

  v_badge_id := v_row.id;

  IF v_criteria_url IS NULL AND COALESCE((p_payload->>'autofillCriteriaUrl')::boolean, true) THEN
    v_criteria_url := rtrim(v_base_url, '/') || '/badgeclasses/' || v_badge_id::text || '/criteria';
    UPDATE "BadgeClass"
    SET "criteriaUrl" = v_criteria_url
    WHERE id = v_badge_id;
    v_row."criteriaUrl" := v_criteria_url;
  END IF;

  v_sort := 0;
  FOR c IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'criteria', '[]'::jsonb))
  LOOP
    INSERT INTO "BadgeCriteria" (id, "badgeClassId", label, description, "sortOrder", "createdAt")
    VALUES (
      gen_random_uuid(),
      v_badge_id,
      c->>'label',
      NULLIF(c->>'description', ''),
      COALESCE((c->>'sortOrder')::int, v_sort),
      now()
    );
    v_sort := v_sort + 1;
  END LOOP;

  IF p_payload->'receivability' IS NOT NULL THEN
    INSERT INTO "BadgeReceivability" (
      id,
      "badgeClassId",
      "expectedModalities",
      "aiEvaluationPrompt",
      "methodConfigs",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      v_badge_id,
      COALESCE(p_payload->'receivability'->>'expectedModalities', ''),
      COALESCE(p_payload->'receivability'->>'aiEvaluationPrompt', ''),
      COALESCE(p_payload->'receivability'->'methodConfigs', '[]'::jsonb),
      now(),
      now()
    );
  END IF;

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_list_badge_classes(p_org_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', bc.id,
        'orgId', bc."orgId",
        'issuerId', bc."issuerId",
        'name', bc.name,
        'description', bc.description,
        'imageUrl', bc."imageUrl",
        'imageTemplateUrl', bc."imageTemplateUrl",
        'status', bc.status,
        'level', bc.level,
        'evaluationMethods', bc."evaluationMethods",
        'requiresEnrollment', bc."requiresEnrollment",
        'requiredCourseId', bc."requiredCourseId",
        'visibleInLearnerDashboard', bc."visibleInLearnerDashboard",
        'createdAt', bc."createdAt",
        'updatedAt', bc."updatedAt"
      )
      ORDER BY bc."createdAt" DESC
    ),
    '[]'::jsonb
  )
  FROM "BadgeClass" bc
  WHERE bc."orgId" = p_org_id;
$$;

CREATE OR REPLACE FUNCTION public.lms_get_badge_class(p_id uuid, p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_bc jsonb;
  v_criteria jsonb;
  v_recv jsonb;
BEGIN
  SELECT to_jsonb(bc.*) INTO v_bc
  FROM "BadgeClass" bc
  WHERE bc.id = p_id AND bc."orgId" = p_org_id;

  IF v_bc IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(c.*) ORDER BY c."sortOrder"), '[]'::jsonb)
  INTO v_criteria
  FROM "BadgeCriteria" c
  WHERE c."badgeClassId" = p_id;

  SELECT to_jsonb(r.*) INTO v_recv
  FROM "BadgeReceivability" r
  WHERE r."badgeClassId" = p_id;

  RETURN v_bc
    || jsonb_build_object('criteria', v_criteria)
    || jsonb_build_object('receivability', v_recv);
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_list_learner_visible_badges(p_org_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', bc.id,
        'name', bc.name,
        'description', bc.description,
        'imageUrl', COALESCE(bc."imageUrl", bc."imageTemplateUrl"),
        'level', bc.level,
        'requiresEnrollment', bc."requiresEnrollment",
        'requiredCourseId', bc."requiredCourseId"
      )
      ORDER BY bc."createdAt" DESC
    ),
    '[]'::jsonb
  )
  FROM "BadgeClass" bc
  WHERE bc."orgId" = p_org_id
    AND bc.status = 'ACTIVE'::"BadgeClassStatus"
    AND bc."visibleInLearnerDashboard" = true;
$$;

CREATE OR REPLACE FUNCTION public.lms_admin_update_badge_class(
  p_id uuid,
  p_org_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requires_enrollment boolean;
  v_visible boolean;
  c jsonb;
  v_sort int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "BadgeClass" bc WHERE bc.id = p_id AND bc."orgId" = p_org_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  v_requires_enrollment := COALESCE((p_payload->>'requiresEnrollment')::boolean, false);
  v_visible := CASE
    WHEN v_requires_enrollment THEN false
    WHEN p_payload ? 'visibleInLearnerDashboard' THEN COALESCE((p_payload->>'visibleInLearnerDashboard')::boolean, false)
    ELSE NULL
  END;

  UPDATE "BadgeClass" bc
  SET
    name = COALESCE(p_payload->>'name', bc.name),
    description = COALESCE(p_payload->>'description', bc.description),
    "imageTemplateUrl" = COALESCE(NULLIF(p_payload->>'imageUrl', ''), NULLIF(p_payload->>'imageTemplateUrl', ''), bc."imageTemplateUrl"),
    "imageUrl" = COALESCE(NULLIF(p_payload->>'imageUrl', ''), bc."imageUrl"),
    "criteriaUrl" = CASE WHEN p_payload ? 'criteriaUrl' THEN NULLIF(p_payload->>'criteriaUrl', '') ELSE bc."criteriaUrl" END,
    "criteriaText" = COALESCE(NULLIF(p_payload->>'criteriaText', ''), bc."criteriaText"),
    "criteriaMarkdown" = COALESCE(NULLIF(p_payload->>'criteriaMarkdown', ''), bc."criteriaMarkdown"),
    alignment = COALESCE(p_payload->'alignment', bc.alignment),
    tags = CASE
      WHEN p_payload ? 'tags' THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'tags'))
      ELSE bc.tags
    END,
    version = COALESCE((p_payload->>'version')::int, bc.version),
    status = COALESCE((p_payload->>'status')::"BadgeClassStatus", bc.status),
    "receivabilityReviewMode" = COALESCE((p_payload->>'receivabilityReviewMode')::"ReceivabilityReviewMode", bc."receivabilityReviewMode"),
    "requiresEnrollment" = COALESCE((p_payload->>'requiresEnrollment')::boolean, bc."requiresEnrollment"),
    "requiredCourseId" = CASE
      WHEN COALESCE((p_payload->>'requiresEnrollment')::boolean, bc."requiresEnrollment") = false THEN NULL
      ELSE COALESCE(NULLIF(p_payload->>'requiredCourseId', ''), bc."requiredCourseId")
    END,
    "visibleInLearnerDashboard" = COALESCE(v_visible, bc."visibleInLearnerDashboard"),
    level = COALESCE(NULLIF(p_payload->>'level', '')::int, bc.level),
    "evaluationMethods" = CASE
      WHEN p_payload ? 'evaluationMethods' THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'evaluationMethods'))
      ELSE bc."evaluationMethods"
    END,
    "validatorExpertId" = COALESCE(NULLIF(p_payload->>'validatorExpertId', ''), bc."validatorExpertId"),
    "updatedAt" = now()
  WHERE bc.id = p_id;

  IF p_payload ? 'criteria' THEN
    DELETE FROM "BadgeCriteria" WHERE "badgeClassId" = p_id;
    v_sort := 0;
    FOR c IN SELECT * FROM jsonb_array_elements(p_payload->'criteria')
    LOOP
      INSERT INTO "BadgeCriteria" (id, "badgeClassId", label, description, "sortOrder", "createdAt")
      VALUES (
        gen_random_uuid(),
        p_id,
        c->>'label',
        NULLIF(c->>'description', ''),
        COALESCE((c->>'sortOrder')::int, v_sort),
        now()
      );
      v_sort := v_sort + 1;
    END LOOP;
  END IF;

  IF p_payload->'receivability' IS NOT NULL THEN
    INSERT INTO "BadgeReceivability" (
      id, "badgeClassId", "expectedModalities", "aiEvaluationPrompt", "methodConfigs", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      p_id,
      COALESCE(p_payload->'receivability'->>'expectedModalities', ''),
      COALESCE(p_payload->'receivability'->>'aiEvaluationPrompt', ''),
      COALESCE(p_payload->'receivability'->'methodConfigs', '[]'::jsonb),
      now(),
      now()
    )
    ON CONFLICT ("badgeClassId") DO UPDATE SET
      "expectedModalities" = EXCLUDED."expectedModalities",
      "aiEvaluationPrompt" = EXCLUDED."aiEvaluationPrompt",
      "methodConfigs" = EXCLUDED."methodConfigs",
      "updatedAt" = now();
  END IF;

  RETURN public.lms_get_badge_class(p_id, p_org_id);
END;
$$;

REVOKE ALL ON FUNCTION public.lms_ensure_openbadges_org(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lms_ensure_openbadges_user(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lms_resolve_issuer_for_org(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lms_admin_create_badge_class(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lms_list_badge_classes(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lms_get_badge_class(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lms_list_learner_visible_badges(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lms_admin_update_badge_class(uuid, uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.lms_ensure_openbadges_org(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lms_ensure_openbadges_user(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lms_resolve_issuer_for_org(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lms_admin_create_badge_class(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.lms_list_badge_classes(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lms_get_badge_class(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lms_list_learner_visible_badges(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lms_admin_update_badge_class(uuid, uuid, jsonb) TO service_role;
