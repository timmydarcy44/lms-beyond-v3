-- ============================================
-- TEST DE VISIBILITÉ DES DOCUMENTS
-- ============================================

-- 1. Créer un document de test pour j.contentin@laposte.net (apprenant)
INSERT INTO public.drive_documents (
    id,
    author_id,
    title,
    content,
    status,
    shared_with,
    word_count,
    file_url,
    folder_id,
    deposited_at,
    submitted_at,
    is_read
) VALUES (
    gen_random_uuid(),
    'd59c9aab-44dd-48ae-8f6d-a49a8867d003'::uuid, -- j.contentin@laposte.net
    'Document de test',
    'Ceci est un document de test créé directement en base',
    'shared',
    '225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid, -- timmydarcy44@gmail.com (formateur)
    10,
    null,
    null,
    now(),
    now(),
    false
)
RETURNING id, title, status, shared_with, author_id;

-- 2. Vérifier que le document a été créé
SELECT 
    id,
    title,
    author_id,
    status,
    shared_with,
    created_at,
    updated_at
FROM public.drive_documents
WHERE author_id = 'd59c9aab-44dd-48ae-8f6d-a49a8867d003'::uuid
ORDER BY updated_at DESC
LIMIT 5;

-- 3. Vérifier la visibilité via shared_with
SELECT 
    id,
    title,
    status,
    shared_with,
    CASE 
        WHEN shared_with = '225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid THEN 'VISIBLE via shared_with'
        ELSE 'NOT VISIBLE'
    END as visibility
FROM public.drive_documents
WHERE shared_with = '225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid
  AND status = 'shared';

-- 4. Vérifier la visibilité via author_id (apprenant du formateur)
SELECT 
    dd.id,
    dd.title,
    dd.status,
    dd.author_id,
    gl.learner_email,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM public.get_instructor_learners('225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid) gl2
            WHERE gl2.learner_id = dd.author_id
            AND dd.status = 'shared'
        ) THEN 'VISIBLE via instructor policy'
        ELSE 'NOT VISIBLE'
    END as visibility
FROM public.drive_documents dd
LEFT JOIN public.get_instructor_learners('225f10f7-850b-4897-8ed6-637cf5ea0cd5'::uuid) gl ON gl.learner_id = dd.author_id
WHERE dd.author_id = 'd59c9aab-44dd-48ae-8f6d-a49a8867d003'::uuid
  AND dd.status = 'shared';




