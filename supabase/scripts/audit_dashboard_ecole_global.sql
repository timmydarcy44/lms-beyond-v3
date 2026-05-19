-- =============================================================================
-- AUDIT GLOBAL — Dashboard École + données associées (exécution en une fois)
-- =============================================================================
-- Où l'exécuter : Supabase → SQL Editor (ou psql sur la base).
--
-- UNE SEULE LIGNE À MODIFIER (compteurs par école, section 08) :
--   Dans le CTE "cfg" plus bas, remplacez NULL par l'UUID de l'établissement,
--   ou laissez NULL pour ignorer la section 08 (les lignes afficheront 0 ou SKIP).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1) Tables attendues (présence)
-- ---------------------------------------------------------------------------
SELECT
  '01_tables' AS section,
  t.table_name AS item,
  CASE WHEN c.relname IS NOT NULL THEN 'OK' ELSE 'MANQUANT' END AS statut,
  COALESCE(pg_catalog.obj_description(c.oid, 'pg_class'), '') AS note
FROM (
  VALUES
    ('profiles'),
    ('school_students'),
    ('school_classes'),
    ('class_enrollments'),
    ('crm_prospects'),
    ('student_handicap_data'),
    ('apprenants'),
    ('job_offers'),
    ('applications'),
    ('quiz_submissions'),
    ('learning_sessions'),
    ('learning_session_events'),
    ('courses'),
    ('tests'),
    ('todo_tasks'),
    ('org_memberships')
) AS t(table_name)
LEFT JOIN pg_catalog.pg_class c
  ON c.relname = t.table_name
 AND c.relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'public')
ORDER BY t.table_name;

-- ---------------------------------------------------------------------------
-- 2) Colonnes critiques (profiles, job_offers, school_classes, todo_tasks, quiz)
-- ---------------------------------------------------------------------------
WITH expected AS (
  SELECT * FROM (VALUES
    ('profiles', 'school_id'),
    ('profiles', 'role'),
    ('profiles', 'role_type'),
    ('profiles', 'company_id'),
    ('job_offers', 'school_id'),
    ('job_offers', 'title'),
    ('job_offers', 'status'),
    ('school_classes', 'school_id'),
    ('school_classes', 'name'),
    ('school_students', 'school_id'),
    ('school_students', 'student_id'),
    ('class_enrollments', 'class_id'),
    ('class_enrollments', 'student_id'),
    ('crm_prospects', 'school_id'),
    ('crm_prospects', 'siret'),
    ('quiz_submissions', 'test_id'),
    ('quiz_submissions', 'user_id'),
    ('quiz_submissions', 'score'),
    ('quiz_submissions', 'answers'),
    ('quiz_submissions', 'review'),
    ('learning_sessions', 'user_id'),
    ('learning_sessions', 'content_type'),
    ('learning_sessions', 'content_id'),
    ('learning_sessions', 'duration_seconds'),
    ('learning_sessions', 'duration_active_seconds'),
    ('todo_tasks', 'id'),
    ('todo_tasks', 'title'),
    ('todo_tasks', 'status')
  ) AS v(tbl, col)
)
SELECT
  '02_colonnes' AS section,
  e.tbl || '.' || e.col AS item,
  CASE
    WHEN c.column_name IS NOT NULL THEN 'OK'
    ELSE 'MANQUANT'
  END AS statut,
  COALESCE(c.data_type || COALESCE(' (' || c.character_maximum_length::text || ')', ''), '') AS note
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col
ORDER BY e.tbl, e.col;

-- Colonnes optionnelles / étendues (signal si absent mais utilisé par le front)
WITH optional AS (
  SELECT * FROM (VALUES
    ('job_offers', 'company_name'),
    ('job_offers', 'company_hidden_from_learner'),
    ('job_offers', 'target_soft_skills'),
    ('job_offers', 'host_company_prospect_id'),
    ('school_classes', 'cover_image_url'),
    ('school_classes', 'referential_structure'),
    ('school_classes', 'referential_extracted_text'),
    ('todo_tasks', 'school_id'),
    ('todo_tasks', 'user_id'),
    ('todo_tasks', 'role_filter'),
    ('todo_tasks', 'task_type')
  ) AS v(tbl, col)
)
SELECT
  '02b_colonnes_optionnelles' AS section,
  o.tbl || '.' || o.col AS item,
  CASE WHEN c.column_name IS NOT NULL THEN 'OK' ELSE 'ABSENT' END AS statut,
  '' AS note
FROM optional o
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = o.tbl
 AND c.column_name = o.col
ORDER BY o.tbl, o.col;

-- ---------------------------------------------------------------------------
-- 3) RLS activé (tables sensibles)
-- ---------------------------------------------------------------------------
SELECT
  '03_rls' AS section,
  c.relname::text AS item,
  CASE WHEN c.relrowsecurity THEN 'RLS ON' ELSE 'RLS OFF' END AS statut,
  '' AS note
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'profiles', 'school_students', 'school_classes', 'class_enrollments',
    'crm_prospects', 'student_handicap_data', 'job_offers', 'applications',
    'quiz_submissions', 'learning_sessions', 'learning_session_events', 'todo_tasks'
  )
ORDER BY c.relname;

-- ---------------------------------------------------------------------------
-- 4) Politiques RLS (comptage par table — repère 0 = table RLS sans policy)
-- ---------------------------------------------------------------------------
SELECT
  '04_policies_rls' AS section,
  tablename::text AS item,
  COUNT(*)::text || ' policy(ies)' AS statut,
  string_agg(policyname, ', ' ORDER BY policyname) AS note
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'school_students', 'school_classes', 'class_enrollments', 'crm_prospects',
    'student_handicap_data', 'job_offers', 'applications', 'quiz_submissions',
    'learning_sessions', 'todo_tasks'
  )
GROUP BY tablename
ORDER BY tablename;

-- Tables RLS sans aucune policy (anomalie)
SELECT
  '04b_rls_sans_policy' AS section,
  c.relname::text AS item,
  'ANOMALIE' AS statut,
  'RLS actif mais 0 policy dans pg_policies' AS note
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND c.relname IN (
    'school_students', 'school_classes', 'class_enrollments', 'crm_prospects',
    'student_handicap_data', 'job_offers', 'applications', 'quiz_submissions',
    'learning_sessions', 'todo_tasks'
  )
GROUP BY c.relname
HAVING COUNT(p.policyname) = 0;

-- ---------------------------------------------------------------------------
-- 5) Index utiles (existence)
-- ---------------------------------------------------------------------------
SELECT
  '05_index' AS section,
  i.relname::text AS item,
  'OK' AS statut,
  pg_get_indexdef(i.oid) AS note
FROM pg_class i
JOIN pg_namespace n ON n.oid = i.relnamespace
WHERE n.nspname = 'public'
  AND i.relkind = 'i'
  AND i.relname IN (
    'school_students_school_id_idx',
    'school_students_student_id_idx',
    'school_classes_school_id_idx',
    'crm_prospects_school_id_idx',
    'crm_prospects_siret_unique_idx',
    'job_offers_school_id_idx',
    'quiz_submissions_test_user_idx',
    'quiz_submissions_user_idx',
    'learning_sessions_user_idx'
  )
ORDER BY i.relname;

-- Index manquants parmi la liste ci-dessus
WITH wanted(name) AS (
  VALUES
    ('school_students_school_id_idx'),
    ('school_students_student_id_idx'),
    ('school_classes_school_id_idx'),
    ('crm_prospects_school_id_idx'),
    ('crm_prospects_siret_unique_idx'),
    ('job_offers_school_id_idx'),
    ('quiz_submissions_test_user_idx'),
    ('quiz_submissions_user_idx'),
    ('learning_sessions_user_idx')
)
SELECT
  '05b_index_manquant' AS section,
  w.name AS item,
  'MANQUANT' AS statut,
  'Exécuter les migrations école / quiz si besoin' AS note
FROM wanted w
WHERE NOT EXISTS (
  SELECT 1 FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = w.name
);

-- ---------------------------------------------------------------------------
-- 6) Cohérence API todo_tasks vs schéma (alertes)
-- ---------------------------------------------------------------------------
SELECT
  '06_todo_tasks_api' AS section,
  check_name AS item,
  statut,
  detail AS note
FROM (
  SELECT
    'colonne school_id' AS check_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'todo_tasks' AND column_name = 'school_id'
    ) THEN 'OK' ELSE 'ALERTE' END AS statut,
    'L''API /api/todo-tasks filtre sur school_id ; sans cette colonne les requêtes échouent.' AS detail
  UNION ALL
  SELECT
    'colonne user_id',
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'todo_tasks' AND column_name = 'user_id'
    ) THEN 'OK' ELSE 'INFO' END,
    'Schéma historique CREATE_TODO_TASKS_TABLE.sql utilise user_id.'
  UNION ALL
  SELECT
    'check priority API',
    CASE
      WHEN EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu
          ON cc.constraint_schema = ccu.constraint_schema AND cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_schema = 'public' AND ccu.table_name = 'todo_tasks'
          AND cc.check_clause ILIKE '%Moyenne%'
      ) THEN 'OK'
      WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'todo_tasks' AND column_name = 'priority'
      ) THEN 'ALERTE'
      ELSE 'N/A'
    END,
    'Si priority est un CHECK (low/normal/high/urgent), l''API ne doit pas insérer ''Moyenne''.'
) s;

-- ---------------------------------------------------------------------------
-- 7) Compteurs globaux (volumétrie) — SQL dynamique : tables absentes => N/A
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS _audit_dashboard_ecole_vol;
CREATE TEMP TABLE _audit_dashboard_ecole_vol (
  section text,
  item text,
  statut text,
  note text
);

DO $$
DECLARE
  cnt text;
BEGIN
  -- Table simple : COUNT(*)
  IF to_regclass('public.school_students') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.school_students' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'school_students', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'school_students', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.school_classes') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.school_classes' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'school_classes', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'school_classes', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.class_enrollments') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.class_enrollments' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'class_enrollments', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'class_enrollments', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.crm_prospects') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.crm_prospects' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'crm_prospects', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'crm_prospects', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.job_offers') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.job_offers' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'job_offers', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'job_offers', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.applications') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.applications' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'applications', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'applications', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.quiz_submissions') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.quiz_submissions' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'quiz_submissions', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'quiz_submissions', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.learning_sessions') IS NOT NULL THEN
    EXECUTE $q$
      SELECT COUNT(*)::text FROM public.learning_sessions WHERE content_type = 'course'
    $q$ INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'learning_sessions (course)', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'learning_sessions (course)', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE $q$
      SELECT COUNT(*)::text FROM public.profiles WHERE school_id IS NOT NULL
    $q$ INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'profiles avec school_id', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'profiles avec school_id', 'N/A', 'table absente');
  END IF;

  IF to_regclass('public.todo_tasks') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.todo_tasks' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'todo_tasks', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES (
      '07_volumes',
      'todo_tasks',
      'N/A',
      'table absente — appliquer supabase/CREATE_TODO_TASKS_TABLE.sql ou migration équivalente'
    );
  END IF;

  IF to_regclass('public.org_memberships') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*)::text FROM public.org_memberships' INTO cnt;
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'org_memberships', cnt, '');
  ELSE
    INSERT INTO _audit_dashboard_ecole_vol VALUES ('07_volumes', 'org_memberships', 'N/A', 'table absente');
  END IF;
END $$;

SELECT * FROM _audit_dashboard_ecole_vol ORDER BY item;

-- ---------------------------------------------------------------------------
-- 8) Compteurs filtrés par école (modifiez UNE fois le CTE cfg ci-dessous)
-- ---------------------------------------------------------------------------
WITH cfg AS (
  SELECT NULL::uuid AS school_id
  -- Exemple : SELECT 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid AS school_id
),
sid AS (SELECT school_id FROM cfg)
SELECT '08_ecole' AS section, 'config' AS item,
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP' ELSE 'OK' END AS statut,
  'Si SKIP : remplacez NULL par l''UUID école dans le CTE cfg (section 08)' AS note
UNION ALL
SELECT '08_ecole', 'school_students',
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP'
       ELSE (SELECT COUNT(*)::text FROM public.school_students ss WHERE ss.school_id = (SELECT school_id FROM sid)) END,
  ''
UNION ALL
SELECT '08_ecole', 'school_classes',
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP'
       ELSE (SELECT COUNT(*)::text FROM public.school_classes sc WHERE sc.school_id = (SELECT school_id FROM sid)) END,
  ''
UNION ALL
SELECT '08_ecole', 'crm_prospects',
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP'
       ELSE (SELECT COUNT(*)::text FROM public.crm_prospects c WHERE c.school_id = (SELECT school_id FROM sid)) END,
  ''
UNION ALL
SELECT '08_ecole', 'job_offers',
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP'
       ELSE (SELECT COUNT(*)::text FROM public.job_offers j WHERE j.school_id = (SELECT school_id FROM sid)) END,
  ''
UNION ALL
SELECT '08_ecole', 'quiz_submissions (élèves école)',
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP'
       ELSE (SELECT COUNT(*)::text FROM public.quiz_submissions q
             JOIN public.school_students ss ON ss.student_id = q.user_id
             WHERE ss.school_id = (SELECT school_id FROM sid)) END,
  ''
UNION ALL
SELECT '08_ecole', 'learning_sessions course (élèves)',
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP'
       ELSE (SELECT COUNT(*)::text FROM public.learning_sessions ls
             JOIN public.school_students ss ON ss.student_id = ls.user_id
             WHERE ss.school_id = (SELECT school_id FROM sid) AND ls.content_type = 'course') END,
  ''
UNION ALL
SELECT '08_ecole', 'apprenants (school_id)',
  CASE WHEN (SELECT school_id FROM sid) IS NULL THEN 'SKIP'
       ELSE (SELECT COUNT(*)::text FROM public.apprenants a WHERE a.school_id = (SELECT school_id FROM sid)) END,
  '';

-- ---------------------------------------------------------------------------
-- 9) Résumé : lignes en erreur / à traiter (vue synthétique)
-- ---------------------------------------------------------------------------
SELECT
  '09_resume' AS section,
  'Tables manquantes (section 01)' AS item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM (
        VALUES
          ('profiles'), ('school_students'), ('school_classes'), ('class_enrollments'),
          ('crm_prospects'), ('job_offers'), ('applications')
      ) AS req(t)
      LEFT JOIN pg_class c ON c.relname = req.t AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      WHERE c.oid IS NULL
    ) THEN 'KO'
    ELSE 'OK'
  END AS statut,
  'Vérifier les migrations 20260503100000_align_ecole_crm_school_jobs.sql etc.' AS note
UNION ALL
SELECT
  '09_resume',
  'todo_tasks vs API',
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'todo_tasks')
      THEN 'N/A'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'todo_tasks' AND column_name = 'school_id'
    ) THEN 'OK (school_id présent)'
    ELSE 'ALERTE (API utilise school_id)'
  END,
  'Voir src/app/api/todo-tasks/route.ts'
UNION ALL
SELECT
  '09_resume',
  'quiz_submissions + service role dashboard',
  'INFO',
  'Lecture agrégée école nécessite souvent bypass RLS (clé service) ; vérifier variables d''env.';

-- =============================================================================
-- FIN — Parcourez les résultats par ordre de section (01 → 09).
-- =============================================================================
