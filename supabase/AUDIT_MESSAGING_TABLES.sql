-- ============================================
-- AUDIT COMPLET DES TABLES DE MESSAGERIE
-- ============================================
-- Vérifie l'existence, la structure et les RLS des tables
-- ============================================

-- 1. VÉRIFICATION D'EXISTENCE DES TABLES
SELECT 
  json_build_object(
    'type', 'TABLE_EXISTENCE',
    'tables', json_build_object(
      'messages', EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
      ),
      'message_recipients', EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'message_recipients'
      ),
      'notifications', EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
      ),
      'drive_documents', EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'drive_documents'
      ),
      'drive_consigne', EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'drive_consigne'
      )
    )
  ) as result;

-- 2. STRUCTURE DE messages
SELECT 
  json_build_object(
    'type', 'MESSAGES_STRUCTURE',
    'columns', COALESCE(
      json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable,
          'column_default', column_default,
          'ordinal_position', ordinal_position
        )
        ORDER BY ordinal_position
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'messages';

-- 3. STRUCTURE DE message_recipients
SELECT 
  json_build_object(
    'type', 'MESSAGE_RECIPIENTS_STRUCTURE',
    'columns', COALESCE(
      json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable,
          'column_default', column_default,
          'ordinal_position', ordinal_position
        )
        ORDER BY ordinal_position
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'message_recipients';

-- 4. STRUCTURE DE notifications
SELECT 
  json_build_object(
    'type', 'NOTIFICATIONS_STRUCTURE',
    'columns', COALESCE(
      json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable,
          'column_default', column_default,
          'ordinal_position', ordinal_position
        )
        ORDER BY ordinal_position
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications';

-- 5. STRUCTURE DE drive_documents
SELECT 
  json_build_object(
    'type', 'DRIVE_DOCUMENTS_STRUCTURE',
    'columns', COALESCE(
      json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable,
          'column_default', column_default,
          'ordinal_position', ordinal_position
        )
        ORDER BY ordinal_position
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drive_documents';

-- 6. RLS POLICIES - messages
SELECT 
  json_build_object(
    'type', 'MESSAGES_RLS',
    'rls_enabled', EXISTS(
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'messages' AND c.relrowsecurity
    ),
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'permissive', permissive,
          'roles', roles,
          'qual', qual,
          'with_check', with_check
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_policies
WHERE tablename = 'messages';

-- 7. RLS POLICIES - message_recipients
SELECT 
  json_build_object(
    'type', 'MESSAGE_RECIPIENTS_RLS',
    'rls_enabled', EXISTS(
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'message_recipients' AND c.relrowsecurity
    ),
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'permissive', permissive,
          'roles', roles,
          'qual', qual,
          'with_check', with_check
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_policies
WHERE tablename = 'message_recipients';

-- 8. RLS POLICIES - notifications
SELECT 
  json_build_object(
    'type', 'NOTIFICATIONS_RLS',
    'rls_enabled', EXISTS(
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'notifications' AND c.relrowsecurity
    ),
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'permissive', permissive,
          'roles', roles,
          'qual', qual,
          'with_check', with_check
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_policies
WHERE tablename = 'notifications';

-- 9. FONCTIONS NÉCESSAIRES
SELECT 
  json_build_object(
    'type', 'FUNCTIONS',
    'functions', json_build_object(
      'is_user_instructor', EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_user_instructor' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ),
      'get_instructor_learners', EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_instructor_learners' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      )
    )
  ) as result;

-- 10. INDEXES - messages
SELECT 
  json_build_object(
    'type', 'MESSAGES_INDEXES',
    'indexes', COALESCE(
      json_agg(
        json_build_object(
          'indexname', indexname,
          'indexdef', indexdef
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'messages';

-- 11. INDEXES - message_recipients
SELECT 
  json_build_object(
    'type', 'MESSAGE_RECIPIENTS_INDEXES',
    'indexes', COALESCE(
      json_agg(
        json_build_object(
          'indexname', indexname,
          'indexdef', indexdef
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'message_recipients';

-- 12. INDEXES - notifications
SELECT 
  json_build_object(
    'type', 'NOTIFICATIONS_INDEXES',
    'indexes', COALESCE(
      json_agg(
        json_build_object(
          'indexname', indexname,
          'indexdef', indexdef
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'notifications';

-- 13. CONTRAINTES ET CLÉS ÉTRANGÈRES
SELECT 
  json_build_object(
    'type', 'FOREIGN_KEYS',
    'constraints', COALESCE(
      json_agg(
        json_build_object(
          'table_name', tc.table_name,
          'constraint_name', tc.constraint_name,
          'column_name', kcu.column_name,
          'foreign_table', ccu.table_name,
          'foreign_column', ccu.column_name
        )
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('messages', 'message_recipients', 'notifications');

-- 14. COMPTAGE DES DONNÉES
SELECT 
  json_build_object(
    'type', 'DATA_COUNTS',
    'messages', (SELECT COUNT(*) FROM public.messages),
    'message_recipients', (SELECT COUNT(*) FROM public.message_recipients),
    'notifications', (SELECT COUNT(*) FROM public.notifications),
    'drive_documents', (SELECT COUNT(*) FROM public.drive_documents)
  ) as result;

-- 15. RÉSUMÉ DES PROBLÈMES POTENTIELS
SELECT 
  json_build_object(
    'type', 'ISSUES_CHECK',
    'messages_missing_type', NOT EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'type'
    ),
    'message_recipients_missing_read', NOT EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'message_recipients' 
      AND column_name = 'read'
    ),
    'notifications_missing_recipient_id', NOT EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'recipient_id'
    ),
    'notifications_missing_payload', NOT EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'payload'
    ),
    'is_user_instructor_missing', NOT EXISTS(
      SELECT 1 FROM pg_proc 
      WHERE proname = 'is_user_instructor' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    )
  ) as result;

