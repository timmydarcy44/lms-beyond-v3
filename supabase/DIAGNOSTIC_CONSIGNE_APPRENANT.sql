-- ============================================
-- DIAGNOSTIC : Pourquoi l'apprenant ne voit pas les consignes
-- ============================================

-- 1. Vérifier les messages récents de type "consigne"
WITH recent_consignes AS (
  SELECT 
    m.id,
    m.sender_id,
    p.email as sender_email,
    m.subject,
    LEFT(m.body, 100) as body_preview,
    m.type,
    m.created_at
  FROM public.messages m
  LEFT JOIN auth.users u ON u.id = m.sender_id
  LEFT JOIN public.profiles p ON p.id = m.sender_id
  WHERE m.type = 'consigne'
  ORDER BY m.created_at DESC
  LIMIT 5
)
SELECT 
  json_build_object(
    'type', 'RECENT_CONSIGNES',
    'messages', COALESCE(
      json_agg(
        json_build_object(
          'id', id,
          'sender_id', sender_id,
          'sender_email', sender_email,
          'subject', subject,
          'body', body_preview,
          'type', type,
          'created_at', created_at
        )
        ORDER BY created_at DESC
      ),
      '[]'::json
    )
  ) as result
FROM recent_consignes;

-- 2. Vérifier les message_recipients pour j.contentin@laposte.net
WITH learner_recipients AS (
  SELECT 
    mr.message_id,
    mr.recipient_id,
    mr.read,
    mr.read_at
  FROM public.message_recipients mr
  WHERE mr.recipient_id = (SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net')
  ORDER BY mr.message_id DESC
  LIMIT 10
)
SELECT 
  json_build_object(
    'type', 'MESSAGE_RECIPIENTS_FOR_LEARNER',
    'learner_email', 'j.contentin@laposte.net',
    'learner_id', (SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net'),
    'recipients', COALESCE(
      json_agg(
        json_build_object(
          'message_id', message_id,
          'recipient_id', recipient_id,
          'read', read,
          'read_at', read_at
        )
        ORDER BY message_id DESC
      ),
      '[]'::json
    )
  ) as result
FROM learner_recipients;

-- 3. Vérifier les RLS policies pour message_recipients (SELECT)
SELECT 
  json_build_object(
    'type', 'MESSAGE_RECIPIENTS_RLS_SELECT',
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'qual', qual,
          'with_check', with_check
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_policies
WHERE tablename = 'message_recipients'
AND cmd = 'SELECT';

-- 4. Vérifier les RLS policies pour messages (SELECT)
SELECT 
  json_build_object(
    'type', 'MESSAGES_RLS_SELECT',
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'qual', qual,
          'with_check', with_check
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_policies
WHERE tablename = 'messages'
AND cmd = 'SELECT';

-- 5. Test : Peut-on lire les messages en tant qu'apprenant ?
-- Simuler l'accès pour j.contentin@laposte.net
SELECT 
  json_build_object(
    'type', 'TEST_LEARNER_ACCESS',
    'can_read_message_recipients', EXISTS(
      SELECT 1 FROM public.message_recipients mr
      WHERE mr.recipient_id = (SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net')
    ),
    'can_read_messages', EXISTS(
      SELECT 1 FROM public.messages m
      WHERE m.id IN (
        SELECT mr.message_id FROM public.message_recipients mr
        WHERE mr.recipient_id = (SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net')
      )
    )
  ) as result;

-- 6. Vérifier les notifications comme fallback
WITH learner_notifications AS (
  SELECT 
    n.id,
    n.type,
    n.recipient_id,
    n.user_id,
    n.payload,
    n.read_at,
    n.created_at
  FROM public.notifications n
  WHERE n.recipient_id = (SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net')
     OR n.user_id = (SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net')
  ORDER BY n.created_at DESC
  LIMIT 10
)
SELECT 
  json_build_object(
    'type', 'NOTIFICATIONS_FOR_LEARNER',
    'notifications', COALESCE(
      json_agg(
        json_build_object(
          'id', id,
          'type', type,
          'recipient_id', recipient_id,
          'user_id', user_id,
          'payload', payload,
          'read_at', read_at,
          'created_at', created_at
        )
        ORDER BY created_at DESC
      ),
      '[]'::json
    )
  ) as result
FROM learner_notifications;

