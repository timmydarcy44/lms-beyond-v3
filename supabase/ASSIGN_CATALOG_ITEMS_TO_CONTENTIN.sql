-- Assigner les items du catalogue à contentin.cabinet@gmail.com
-- ==============================================================

DO $$
DECLARE
  v_contentin_id UUID;
  v_course_id UUID;
  v_catalog_item_id UUID;
BEGIN
  -- Récupérer l'ID de contentin.cabinet@gmail.com
  SELECT id INTO v_contentin_id
  FROM profiles
  WHERE email = 'contentin.cabinet@gmail.com';
  
  IF v_contentin_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur contentin.cabinet@gmail.com non trouvé';
  END IF;
  
  RAISE NOTICE 'ID de contentin.cabinet@gmail.com: %', v_contentin_id;
  
  -- Pour chaque course créé par contentin.cabinet@gmail.com qui n'est pas dans le catalogue
  -- ou qui est dans le catalogue mais sans creator_id correct
  FOR v_course_id IN 
    SELECT c.id
    FROM courses c
    WHERE c.creator_id = v_contentin_id
  LOOP
    -- Vérifier si l'item existe déjà dans le catalogue
    SELECT id INTO v_catalog_item_id
    FROM catalog_items
    WHERE content_id = v_course_id
      AND item_type = 'module'
    LIMIT 1;
    
    IF v_catalog_item_id IS NOT NULL THEN
      -- Mettre à jour le creator_id si nécessaire
      UPDATE catalog_items
      SET creator_id = v_contentin_id
      WHERE id = v_catalog_item_id
        AND (creator_id IS NULL OR creator_id != v_contentin_id);
      
      RAISE NOTICE 'Catalog item % mis à jour avec creator_id = %', v_catalog_item_id, v_contentin_id;
    ELSE
      RAISE NOTICE 'Course % pas encore dans le catalogue (à créer manuellement)', v_course_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Terminé';
END $$;

-- Vérifier les résultats
SELECT 
  'CATALOG ITEMS PAR CREATOR APRES ASSIGNATION' as "Info",
  p.email as creator_email,
  COUNT(*) as item_count
FROM catalog_items ci
LEFT JOIN profiles p ON p.id = ci.creator_id
GROUP BY p.email, ci.creator_id
ORDER BY item_count DESC;



