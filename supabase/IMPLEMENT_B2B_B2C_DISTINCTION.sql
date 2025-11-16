-- Implémentation de la distinction B2B/B2C pour les learners
-- ============================================================
-- 
-- Architecture :
--   - B2B : learners avec org_id IS NOT NULL (dans une organisation)
--   - B2C : learners avec org_id IS NULL (clients individuels)
--
-- ============================================================

-- 1. Fonction pour déterminer si un user est B2C
CREATE OR REPLACE FUNCTION is_b2c_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = user_id
      AND p.role IN ('learner', 'student')
      AND NOT EXISTS (
        SELECT 1
        FROM org_memberships om
        WHERE om.user_id = p.id
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour obtenir l'org_id d'un user (NULL si B2C)
CREATE OR REPLACE FUNCTION get_user_org_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_org_id UUID;
BEGIN
  SELECT om.org_id INTO user_org_id
  FROM org_memberships om
  WHERE om.user_id = user_id
  ORDER BY om.created_at DESC
  LIMIT 1;
  
  RETURN user_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour vérifier si un learner peut accéder à un course
--    (B2B : via enrollments/content_assignments, B2C : via catalog_access)
CREATE OR REPLACE FUNCTION can_learner_access_course(
  learner_id UUID,
  course_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  is_b2c BOOLEAN;
BEGIN
  -- Déterminer si B2C
  is_b2c := is_b2c_user(learner_id);
  
  IF is_b2c THEN
    -- B2C : Vérifier l'accès via catalog_access
    RETURN EXISTS (
      SELECT 1
      FROM catalog_access ca
      INNER JOIN catalog_items ci ON ca.catalog_item_id = ci.id
      WHERE ca.user_id = learner_id
        AND ci.content_id = course_id
        AND ci.item_type = 'module'
        AND ca.access_status IN ('purchased', 'manually_granted', 'free')
        AND ci.is_active = true
    );
  ELSE
    -- B2B : Vérifier l'accès via enrollments ou content_assignments
    user_org_id := get_user_org_id(learner_id);
    
    RETURN EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.learner_id = learner_id
        AND e.course_id = course_id
    ) OR EXISTS (
      SELECT 1
      FROM content_assignments ca
      WHERE ca.user_id = learner_id
        AND ca.content_id = course_id
        AND ca.content_type = 'course'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Vérifier les learners B2C existants
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  'B2C' as user_type
FROM profiles p
WHERE p.role IN ('learner', 'student')
  AND NOT EXISTS (
    SELECT 1
    FROM org_memberships om
    WHERE om.user_id = p.id
  );

-- 5. Vérifier les learners B2B existants
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  om.org_id,
  o.name as org_name,
  'B2B' as user_type
FROM profiles p
INNER JOIN org_memberships om ON p.id = om.user_id
INNER JOIN organizations o ON om.org_id = o.id
WHERE p.role IN ('learner', 'student')
  AND om.role = 'learner';

