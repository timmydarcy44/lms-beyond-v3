-- Diagnostic du catalogue Beyond No School
-- Vérifier l'état des catalog_items pour Tim (Super Admin)

-- 1. Vérifier le Super Admin ID de Tim
SELECT 
    sa.user_id,
    p.email,
    sa.is_active as super_admin_active
FROM super_admins sa
JOIN profiles p ON p.id = sa.user_id
WHERE p.email = 'timdarcypro@gmail.com';

-- 2. Compter les catalog_items pour Tim
SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE is_active = true) as active_items,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_items,
    COUNT(*) FILTER (WHERE target_audience = 'apprenant') as for_learners,
    COUNT(*) FILTER (WHERE target_audience = 'pro') as for_pros,
    COUNT(*) FILTER (WHERE target_audience = 'all') as for_all,
    COUNT(*) FILTER (WHERE target_audience IS NULL) as no_audience
FROM catalog_items
WHERE creator_id = (SELECT user_id FROM super_admins sa JOIN profiles p ON p.id = sa.user_id WHERE p.email = 'timdarcypro@gmail.com' LIMIT 1);

-- 3. Lister les items actifs pour apprenants
SELECT 
    id,
    item_type,
    title,
    is_active,
    target_audience,
    category,
    created_at,
    updated_at
FROM catalog_items
WHERE creator_id = (SELECT user_id FROM super_admins sa JOIN profiles p ON p.id = sa.user_id WHERE p.email = 'timdarcypro@gmail.com' LIMIT 1)
  AND is_active = true
  AND (target_audience = 'apprenant' OR target_audience = 'all')
ORDER BY created_at DESC
LIMIT 20;

-- 4. Vérifier les formations (courses) associées
SELECT 
    c.id,
    c.title,
    c.status,
    c.assignment_type,
    c.target_audience as course_target_audience,
    ci.id as catalog_item_id,
    ci.is_active as catalog_item_active,
    ci.target_audience as catalog_item_target_audience
FROM courses c
LEFT JOIN catalog_items ci ON ci.content_id = c.id AND ci.item_type = 'module'
WHERE c.creator_id = (SELECT user_id FROM super_admins sa JOIN profiles p ON p.id = sa.user_id WHERE p.email = 'timdarcypro@gmail.com' LIMIT 1)
ORDER BY c.created_at DESC
LIMIT 20;

-- 5. Vérifier les catalog_items sans contenu associé (orphelins)
SELECT 
    ci.id,
    ci.item_type,
    ci.title,
    ci.content_id,
    ci.is_active,
    ci.target_audience
FROM catalog_items ci
WHERE ci.creator_id = (SELECT user_id FROM super_admins sa JOIN profiles p ON p.id = sa.user_id WHERE p.email = 'timdarcypro@gmail.com' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM courses WHERE id = ci.content_id AND ci.item_type = 'module'
    UNION
    SELECT 1 FROM tests WHERE id = ci.content_id AND ci.item_type = 'test'
    UNION
    SELECT 1 FROM resources WHERE id = ci.content_id AND ci.item_type = 'ressource'
  );



