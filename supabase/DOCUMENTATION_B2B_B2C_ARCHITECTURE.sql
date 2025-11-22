-- Documentation : Architecture B2B vs B2C pour les learners
-- ============================================================
-- 
-- APPROCHE : Utilisation du rôle "learner" avec distinction par org_id
-- 
-- B2B (Business to Business) :
--   - Learners avec org_id IS NOT NULL
--   - Appartiennent à une organisation (CFA, entreprise, etc.)
--   - Accès aux formations assignées par leur organisation
--   - Gérés par les formateurs/admins de leur organisation
--
-- B2C (Business to Consumer) :
--   - Learners avec org_id IS NULL
--   - Clients individuels
--   - Accès au catalogue pour acheter des formations
--   - Accès aux formations achetées via catalog_access
--
-- ============================================================
-- RLS Policies à vérifier/adapter :
-- ============================================================

-- 1. Les learners B2C doivent pouvoir voir le catalogue
--    (catalog_items avec is_active = true)

-- 2. Les learners B2C doivent pouvoir acheter des formations
--    (créer des entrées dans catalog_access avec access_status = 'purchased')

-- 3. Les learners B2C doivent pouvoir accéder aux formations achetées
--    (courses liés via catalog_items et catalog_access)

-- 4. Les learners B2B doivent voir uniquement les formations assignées
--    (via enrollments ou content_assignments avec leur org_id)

-- ============================================================
-- Fonctions utilitaires à créer :
-- ============================================================

-- Fonction pour déterminer si un user est B2C
CREATE OR REPLACE FUNCTION is_b2c_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    LEFT JOIN org_memberships om ON p.id = om.user_id
    WHERE p.id = user_id
      AND p.role = 'learner'
      AND om.org_id IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir l'org_id d'un user (NULL si B2C)
CREATE OR REPLACE FUNCTION get_user_org_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_org_id UUID;
BEGIN
  SELECT om.org_id INTO user_org_id
  FROM org_memberships om
  WHERE om.user_id = user_id
  LIMIT 1;
  
  RETURN user_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Vérifications :
-- ============================================================

-- Vérifier les learners B2C (sans organisation)
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  om.org_id
FROM profiles p
LEFT JOIN org_memberships om ON p.id = om.user_id
WHERE p.role = 'learner'
  AND om.org_id IS NULL;

-- Vérifier les learners B2B (avec organisation)
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  om.org_id,
  o.name as org_name
FROM profiles p
INNER JOIN org_memberships om ON p.id = om.user_id
INNER JOIN organizations o ON om.org_id = o.id
WHERE p.role = 'learner'
  AND om.role = 'learner';








