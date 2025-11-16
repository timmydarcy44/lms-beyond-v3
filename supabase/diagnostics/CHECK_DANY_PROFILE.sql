-- Vérifier si Dany Pain a un profil dans la table profiles
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.phone,
    au.email as auth_email,
    au.id as auth_id
FROM profiles p
FULL OUTER JOIN auth.users au ON au.id = p.id
WHERE au.email = 'paindany36@gmail.com' OR p.email = 'paindany36@gmail.com';

-- Vérifier les membreships de Dany
SELECT 
    om.id,
    om.user_id,
    om.org_id,
    om.role,
    o.name as org_name
FROM org_memberships om
LEFT JOIN organizations o ON o.id = om.org_id
WHERE om.user_id IN (
    SELECT id FROM auth.users WHERE email = 'paindany36@gmail.com'
    UNION
    SELECT id FROM profiles WHERE email = 'paindany36@gmail.com'
);




