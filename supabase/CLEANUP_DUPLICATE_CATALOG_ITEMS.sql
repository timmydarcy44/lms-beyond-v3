-- Script pour nettoyer les catalog_items en double
-- Garde seulement le plus récent pour chaque (content_id, item_type, creator_id)

DO $$
DECLARE
  duplicate_record RECORD;
  items_to_keep UUID;
  items_to_delete UUID[];
  deleted_count INTEGER := 0;
BEGIN
  -- Parcourir tous les groupes de doublons
  FOR duplicate_record IN
    SELECT 
      content_id,
      item_type,
      creator_id,
      COUNT(*) as count,
      array_agg(id ORDER BY created_at DESC) as item_ids
    FROM catalog_items
    WHERE content_id IS NOT NULL
      AND creator_id IS NOT NULL
    GROUP BY content_id, item_type, creator_id
    HAVING COUNT(*) > 1
  LOOP
    -- Le premier ID est le plus récent (grâce à ORDER BY created_at DESC)
    items_to_keep := duplicate_record.item_ids[1];
    -- Les autres sont à supprimer
    items_to_delete := duplicate_record.item_ids[2:array_length(duplicate_record.item_ids, 1)];
    
    -- Supprimer les doublons (garder seulement le plus récent)
    DELETE FROM catalog_items
    WHERE id = ANY(items_to_delete);
    
    deleted_count := deleted_count + array_length(items_to_delete, 1);
    
    RAISE NOTICE 'Supprimé % doublon(s) pour content_id=%, item_type=%, creator_id=%. Gardé: %', 
      array_length(items_to_delete, 1),
      duplicate_record.content_id,
      duplicate_record.item_type,
      duplicate_record.creator_id,
      items_to_keep;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Nettoyage terminé. Total de catalog_items supprimés: %', deleted_count;
END $$;

-- Vérification : compter les doublons restants
SELECT 
  content_id,
  item_type,
  creator_id,
  COUNT(*) as count
FROM catalog_items
WHERE content_id IS NOT NULL
  AND creator_id IS NOT NULL
GROUP BY content_id, item_type, creator_id
HAVING COUNT(*) > 1
ORDER BY count DESC;


