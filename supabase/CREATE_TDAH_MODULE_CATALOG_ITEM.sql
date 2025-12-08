-- Créer le catalog_item pour le module "Qu'est-ce que le TDAH ?"
-- Course ID: 35386cda-1396-4ade-9ed7-f5e5184a2a6e

DO $$
DECLARE
  v_jessica_profile_id UUID;
  v_course_id UUID := '35386cda-1396-4ade-9ed7-f5e5184a2a6e';
  v_course RECORD;
  v_catalog_item_id UUID;
  v_title TEXT;
  v_description TEXT;
  v_price NUMERIC;
  v_snapshot JSONB;
  v_hero_image TEXT;
  v_category TEXT;
BEGIN
  -- 1. Récupérer l'ID de Jessica Contentin
  SELECT id INTO v_jessica_profile_id
  FROM profiles
  WHERE email = 'contentin.cabinet@gmail.com';
  
  IF v_jessica_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil de Jessica Contentin non trouvé';
  END IF;
  
  RAISE NOTICE '✅ Profil Jessica trouvé: %', v_jessica_profile_id;
  
  -- 2. Vérifier si le course existe
  SELECT 
    id,
    title,
    description,
    builder_snapshot,
    cover_image,
    price,
    category,
    creator_id,
    created_at,
    updated_at
  INTO v_course
  FROM courses
  WHERE id = v_course_id;
  
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'Course non trouvé avec ID: %', v_course_id;
  END IF;
  
  RAISE NOTICE '✅ Course trouvé: %', v_course.title;
  
  -- 3. Vérifier si un catalog_item existe déjà
  SELECT id INTO v_catalog_item_id
  FROM catalog_items
  WHERE content_id = v_course_id
    AND item_type = 'module';
  
  IF v_catalog_item_id IS NOT NULL THEN
    RAISE NOTICE '⚠️ Catalog item existe déjà avec ID: %', v_catalog_item_id;
    RETURN;
  END IF;
  
  -- 4. Extraire les valeurs du snapshot si disponible
  v_snapshot := v_course.builder_snapshot;
  v_title := COALESCE(v_snapshot->'general'->>'title', v_course.title);
  v_description := COALESCE(v_snapshot->'general'->>'description', v_course.description, '');
  v_price := COALESCE((v_snapshot->'general'->>'price')::numeric, v_course.price, 0);
  v_category := COALESCE(v_snapshot->'general'->>'category', v_course.category, 'business');
  v_hero_image := COALESCE(v_snapshot->'general'->>'heroImage', v_course.cover_image);
  
  -- 5. Créer le catalog_item
  INSERT INTO catalog_items (
    content_id,
    item_type,
    title,
    description,
    short_description,
    price,
    is_free,
    category,
    hero_image_url,
    thumbnail_url,
    target_audience,
    creator_id,
    created_by,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_course_id,
    'module',
    v_title,
    v_description,
    COALESCE(LEFT(v_description, 150), ''),
    v_price,
    (v_price = 0),
    v_category,
    v_hero_image,
    v_hero_image,
    'apprenant', -- Pour Jessica Contentin, toujours "apprenant"
    v_jessica_profile_id,
    v_jessica_profile_id,
    true, -- Toujours actif
    v_course.created_at,
    v_course.updated_at
  ) RETURNING id INTO v_catalog_item_id;
  
  RAISE NOTICE '✅ Catalog item créé avec succès!';
  RAISE NOTICE '   ID: %', v_catalog_item_id;
  RAISE NOTICE '   Titre: %', v_title;
  RAISE NOTICE '   Prix: %€', v_price;
  RAISE NOTICE '   Gratuit: %', (v_price = 0);
  
END $$;

-- Vérification : afficher le catalog_item créé
SELECT 
    ci.id AS catalog_item_id,
    ci.title,
    ci.item_type,
    ci.content_id,
    ci.price,
    ci.is_free,
    ci.is_active,
    ci.created_by,
    ci.creator_id,
    c.title AS course_title
FROM catalog_items ci
LEFT JOIN courses c ON c.id = ci.content_id
WHERE ci.content_id = '35386cda-1396-4ade-9ed7-f5e5184a2a6e'
  AND ci.item_type = 'module';

