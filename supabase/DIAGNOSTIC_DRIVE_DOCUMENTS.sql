-- ============================================
-- DIAGNOSTIC COMPLET POUR drive_documents
-- ============================================

-- 1. Vérifier tous les documents existants
SELECT 
    id,
    title,
    author_id,
    status,
    shared_with,
    word_count,
    submitted_at,
    updated_at
FROM public.drive_documents
ORDER BY updated_at DESC;

-- 2. Compter les documents par statut
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'shared') as shared,
    COUNT(*) FILTER (WHERE status = 'draft') as draft,
    COUNT(*) FILTER (WHERE shared_with IS NOT NULL) as with_shared_with
FROM public.drive_documents;

-- 3. Vérifier les apprenants du formateur (timmydarcy44@gmail.com)
SELECT 
    gl.learner_id,
    gl.learner_email,
    gl.learner_full_name
FROM public.get_instructor_learners('225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid) gl;

-- 4. Vérifier si les documents des apprenants sont visibles pour le formateur
-- (Simuler la requête du formateur)
SELECT 
    dd.id,
    dd.title,
    dd.author_id,
    dd.status,
    dd.shared_with,
    gl.learner_email,
    CASE 
        WHEN dd.shared_with = '225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid THEN 'via shared_with'
        WHEN EXISTS (
            SELECT 1 
            FROM public.get_instructor_learners('225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid) gl2
            WHERE gl2.learner_id = dd.author_id
            AND dd.status = 'shared'
        ) THEN 'via instructor policy'
        ELSE 'NOT VISIBLE'
    END as visibility_reason
FROM public.drive_documents dd
LEFT JOIN public.get_instructor_learners('225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid) gl ON gl.learner_id = dd.author_id
WHERE dd.author_id = 'd59c9aab-44dd-48ae-8f6d-a49a8867d003'::uuid  -- j.contentin@laposte.net
   OR dd.shared_with = '225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid;

-- 5. Test direct de la RLS policy pour le formateur
SET ROLE authenticated;
SET request.jwt.claim.sub = '225f10f7-850b-4897-8ed6-637cf5ea0cd5';
SELECT * FROM public.drive_documents;
RESET ROLE;



