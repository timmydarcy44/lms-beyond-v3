-- ============================================
-- Script pour supprimer la formation dupliquée
-- "Les neurosciences appliquées à la pédagogie"
-- sans apprenant
-- ============================================

BEGIN;

-- Afficher les formations à supprimer
DO $$
DECLARE
  course_record RECORD;
  course_to_delete UUID;
BEGIN
  RAISE NOTICE '=== RECHERCHE DES FORMATIONS DUPLIQUÉES ===';
  RAISE NOTICE '';
  
  -- Trouver la formation "Les neurosciences appliquées à la pédagogie" sans apprenant
  FOR course_record IN
    SELECT 
      c.id,
      c.title,
      c.created_at,
      c.updated_at,
      c.status,
      COUNT(e.id) as enrollments_count,
      COUNT(pc.path_id) as paths_count
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN path_courses pc ON pc.course_id = c.id
    WHERE c.title ILIKE '%neurosciences appliquées à la pédagogie%'
       OR c.title ILIKE '%neurosciences appliquées à la pédagogique%'
    GROUP BY c.id, c.title, c.created_at, c.updated_at, c.status
    ORDER BY c.updated_at DESC, c.created_at DESC
  LOOP
    RAISE NOTICE 'Formation trouvée:';
    RAISE NOTICE '  ID: %', course_record.id;
    RAISE NOTICE '  Titre: %', course_record.title;
    RAISE NOTICE '  Créée: %', course_record.created_at;
    RAISE NOTICE '  Mise à jour: %', course_record.updated_at;
    RAISE NOTICE '  Statut: %', course_record.status;
    RAISE NOTICE '  Apprenants: %', course_record.enrollments_count;
    RAISE NOTICE '  Dans parcours: %', course_record.paths_count;
    
    IF course_record.enrollments_count = 0 AND course_record.paths_count = 0 THEN
      RAISE NOTICE '  → CETTE FORMATION SERA SUPPRIMÉE (pas d''apprenants, pas dans parcours)';
      course_to_delete := course_record.id;
    ELSE
      RAISE NOTICE '  → Cette formation sera GARDÉE (a des apprenants ou est dans un parcours)';
    END IF;
    
    RAISE NOTICE '';
  END LOOP;
  
  IF course_to_delete IS NULL THEN
    RAISE NOTICE '⚠ Aucune formation à supprimer trouvée';
  ELSE
    RAISE NOTICE '✓ Formation à supprimer identifiée: %', course_to_delete;
  END IF;
END $$;

-- Supprimer la formation sans apprenant
DO $$
DECLARE
  course_to_delete UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUPPRESSION ===';
  
  -- Trouver la formation à supprimer
  SELECT c.id INTO course_to_delete
  FROM courses c
  LEFT JOIN enrollments e ON e.course_id = c.id
  LEFT JOIN path_courses pc ON pc.course_id = c.id
  WHERE (c.title ILIKE '%neurosciences appliquées à la pédagogie%'
         OR c.title ILIKE '%neurosciences appliquées à la pédagogique%')
    AND NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM path_courses WHERE course_id = c.id)
  ORDER BY c.updated_at ASC, c.created_at ASC  -- Prendre la plus ancienne si plusieurs
  LIMIT 1;
  
  IF course_to_delete IS NULL THEN
    RAISE NOTICE '⚠ Aucune formation à supprimer trouvée';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Suppression de la formation: %', course_to_delete;
  
  -- Supprimer les références (sécurité supplémentaire)
  DELETE FROM enrollments WHERE course_id = course_to_delete;
  DELETE FROM path_courses WHERE course_id = course_to_delete;
  DELETE FROM course_progress WHERE course_id = course_to_delete;
  
  -- Supprimer la formation
  DELETE FROM courses WHERE id = course_to_delete;
  
  RAISE NOTICE '✓ Formation supprimée avec succès';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '✗ Erreur lors de la suppression: %', SQLERRM;
  RAISE;
END $$;

-- Vérification finale
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM courses
  WHERE title ILIKE '%neurosciences appliquées à la pédagogie%'
     OR title ILIKE '%neurosciences appliquées à la pédagogique%';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== VÉRIFICATION FINALE ===';
  RAISE NOTICE 'Formations restantes avec ce titre: %', remaining_count;
  
  IF remaining_count = 1 THEN
    RAISE NOTICE '✓ Parfait ! Il ne reste qu''une seule formation';
  ELSIF remaining_count > 1 THEN
    RAISE NOTICE '⚠ Il reste encore % formations avec ce titre', remaining_count;
  ELSE
    RAISE NOTICE '⚠ Aucune formation trouvée avec ce titre';
  END IF;
END $$;

COMMIT;



