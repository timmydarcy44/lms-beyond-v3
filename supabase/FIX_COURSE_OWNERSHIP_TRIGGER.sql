-- ============================================
-- Script pour corriger le problème de transfert de propriété des formations
-- ============================================
-- Problème : Le trigger sync_courses_creator_owner() synchronise creator_id avec owner_id
-- ce qui peut transférer la propriété d'une formation si owner_id change
-- ============================================
-- Solution : 
-- 1. Désactiver le trigger qui synchronise creator_id avec owner_id
-- 2. S'assurer que creator_id ne change JAMAIS après la création initiale
-- 3. owner_id peut changer (pour transfert de propriété explicite), mais creator_id reste fixe
-- ============================================

-- 1. Désactiver le trigger problématique
DROP TRIGGER IF EXISTS sync_courses_creator ON public.courses;

-- 2. Supprimer la fonction de synchronisation (optionnel, mais recommandé)
DROP FUNCTION IF EXISTS sync_courses_creator_owner();

-- 3. Créer un nouveau trigger qui PROTÈGE creator_id (ne le change jamais après création)
CREATE OR REPLACE FUNCTION protect_course_creator_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si c'est une INSERTION (nouvelle formation), définir creator_id depuis owner_id
  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_id IS NOT NULL AND (NEW.creator_id IS NULL OR NEW.creator_id != NEW.owner_id) THEN
      NEW.creator_id := NEW.owner_id;
    END IF;
  END IF;
  
  -- Si c'est une MISE À JOUR, PROTÉGER creator_id (ne jamais le changer)
  IF TG_OP = 'UPDATE' THEN
    -- Toujours garder le creator_id original, même si owner_id change
    -- (owner_id peut changer pour transfert de propriété, mais creator_id reste le créateur original)
    IF OLD.creator_id IS NOT NULL THEN
      NEW.creator_id := OLD.creator_id;
    ELSIF NEW.owner_id IS NOT NULL AND NEW.creator_id IS NULL THEN
      -- Seulement si creator_id était NULL, utiliser owner_id
      NEW.creator_id := NEW.owner_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Créer le nouveau trigger
CREATE TRIGGER protect_courses_creator
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION protect_course_creator_id();

-- 5. Vérification : Afficher les triggers actifs
SELECT 
  'TRIGGERS SUR courses' as "Info",
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'courses'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- 6. Commentaire
COMMENT ON FUNCTION protect_course_creator_id() IS 
  'Protège creator_id : définit creator_id depuis owner_id lors de la création, mais ne le change jamais lors des mises à jour. owner_id peut changer pour transfert de propriété, mais creator_id reste le créateur original.';



