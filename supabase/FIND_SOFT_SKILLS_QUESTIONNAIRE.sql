-- Script pour trouver le questionnaire Soft Skills "Soft Skills – Profil 360"
-- ============================================================================

-- Chercher tous les questionnaires Soft Skills
SELECT 
  q.id as questionnaire_id,
  q.title,
  q.description,
  q.created_by,
  p.email as creator_email,
  q.org_id,
  o.name as organization_name,
  q.is_active,
  q.created_at,
  COUNT(qst.id) as questions_count
FROM public.mental_health_questionnaires q
JOIN public.profiles p ON p.id = q.created_by
LEFT JOIN public.organizations o ON o.id = q.org_id
LEFT JOIN public.mental_health_questions qst ON qst.questionnaire_id = q.id
WHERE q.title ILIKE '%Soft Skills%'
GROUP BY q.id, q.title, q.description, q.created_by, p.email, q.org_id, o.name, q.is_active, q.created_at
ORDER BY q.created_at DESC;

