-- Garantir qu'un student n'a qu'une seule organisation
-- ============================================================
-- 
-- Cette migration vérifie et corrige les cas où un student
-- aurait plusieurs org_memberships
--
-- ============================================================

-- 1. Identifier les students avec plusieurs organisations
SELECT 
  p.id,
  p.email,
  p.full_name,
  COUNT(om.org_id) as org_count,
  ARRAY_AGG(om.org_id) as org_ids,
  ARRAY_AGG(o.name) as org_names
FROM profiles p
INNER JOIN org_memberships om ON p.id = om.user_id
INNER JOIN organizations o ON om.org_id = o.id
WHERE p.role IN ('learner', 'student')
  AND om.role = 'learner'
GROUP BY p.id, p.email, p.full_name
HAVING COUNT(om.org_id) > 1;

-- 2. Pour chaque student avec plusieurs orgs, garder la plus récente
--    et supprimer les autres
DO $$
DECLARE
  student_record RECORD;
  keep_org_id UUID;
BEGIN
  FOR student_record IN 
    SELECT 
      p.id as user_id,
      COUNT(om.org_id) as org_count
    FROM profiles p
    INNER JOIN org_memberships om ON p.id = om.user_id
    WHERE p.role IN ('learner', 'student')
      AND om.role = 'learner'
    GROUP BY p.id
    HAVING COUNT(om.org_id) > 1
  LOOP
    -- Récupérer l'org_id le plus récent (ou la première si pas de created_at)
    SELECT om.org_id INTO keep_org_id
    FROM org_memberships om
    WHERE om.user_id = student_record.user_id
      AND om.role = 'learner'
    ORDER BY COALESCE(om.created_at, '1970-01-01'::timestamp) DESC
    LIMIT 1;
    
    -- Supprimer les autres membreships
    DELETE FROM org_memberships
    WHERE user_id = student_record.user_id
      AND role = 'learner'
      AND org_id != keep_org_id;
    
    RAISE NOTICE 'Student % maintenant dans une seule organisation: %', 
      student_record.user_id, keep_org_id;
  END LOOP;
END $$;

-- 3. Créer une contrainte unique pour garantir qu'un student n'a qu'une seule org
--    (en tenant compte du rôle dans org_memberships)
CREATE UNIQUE INDEX IF NOT EXISTS unique_student_org_membership 
ON org_memberships (user_id) 
WHERE role = 'learner';

-- 4. Vérifier que tous les students n'ont maintenant qu'une seule organisation
SELECT 
  p.id,
  p.email,
  p.full_name,
  COUNT(om.org_id) as org_count
FROM profiles p
INNER JOIN org_memberships om ON p.id = om.user_id
WHERE p.role IN ('learner', 'student')
  AND om.role = 'learner'
GROUP BY p.id, p.email, p.full_name
HAVING COUNT(om.org_id) > 1;

-- Si cette requête retourne des résultats, il reste des problèmes à corriger manuellement



