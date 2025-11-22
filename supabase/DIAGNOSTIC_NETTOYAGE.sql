-- Script de diagnostic pour identifier les éléments à nettoyer dans Supabase
-- ⚠️ NE SUPPRIME RIEN - Diagnostic uniquement

-- 1. Vérifier la taille de la base de données
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- 2. Vérifier les anciennes sessions auth (plus de 30 jours)
SELECT 
    COUNT(*) as old_sessions_count,
    'auth.sessions' as table_name
FROM auth.sessions
WHERE created_at < NOW() - INTERVAL '30 days';

-- 3. Vérifier les anciens refresh tokens (plus de 30 jours)
SELECT 
    COUNT(*) as old_refresh_tokens_count,
    'auth.refresh_tokens' as table_name
FROM auth.refresh_tokens
WHERE created_at < NOW() - INTERVAL '30 days';

-- 4. Vérifier les anciens logs/audit (si table existe)
-- Note: Supabase gère ses propres logs, on ne peut généralement pas les nettoyer

-- 5. Vérifier les anciennes entrées dans catalog_items inactives
SELECT 
    COUNT(*) as inactive_catalog_items,
    'catalog_items (is_active = false)' as description
FROM catalog_items
WHERE is_active = false;

-- 6. Vérifier les anciennes formations en brouillon (plus de 90 jours)
SELECT 
    COUNT(*) as old_draft_courses,
    'courses (status = draft, > 90 jours)' as description
FROM courses
WHERE status = 'draft' 
  AND created_at < NOW() - INTERVAL '90 days';

-- 7. Vérifier les anciens tests en brouillon
SELECT 
    COUNT(*) as old_draft_tests,
    'tests (status = draft, > 90 jours)' as description
FROM tests
WHERE status = 'draft' 
  AND created_at < NOW() - INTERVAL '90 days';

-- 8. Vérifier les anciennes ressources en brouillon
SELECT 
    COUNT(*) as old_draft_resources,
    'resources (status = draft, > 90 jours)' as description
FROM resources
WHERE status = 'draft' 
  AND created_at < NOW() - INTERVAL '90 days';

-- 9. Vérifier les anciens todos (plus de 90 jours, complétés)
SELECT 
    COUNT(*) as old_completed_todos,
    'todo_tasks (completed, > 90 jours)' as description
FROM todo_tasks
WHERE completed = true 
  AND updated_at < NOW() - INTERVAL '90 days';

-- 10. Vérifier les anciennes interactions IA (plus de 90 jours)
SELECT 
    COUNT(*) as old_ai_interactions,
    'ai_interactions (> 90 jours)' as description
FROM ai_interactions
WHERE created_at < NOW() - INTERVAL '90 jours';

-- 11. Vérifier les anciens flashcards non utilisés (plus de 90 jours, jamais révisés)
SELECT 
    COUNT(*) as old_unused_flashcards,
    'flashcards (jamais révisés, > 90 jours)' as description
FROM flashcards
WHERE last_reviewed_at IS NULL 
  AND created_at < NOW() - INTERVAL '90 days';

-- 12. Vérifier les anciens rendez-vous passés (plus de 90 jours)
SELECT 
    COUNT(*) as old_appointments,
    'appointments (passés, > 90 jours)' as description
FROM appointments
WHERE appointment_date < NOW() - INTERVAL '90 days';

-- 13. Vérifier les anciennes notifications (plus de 30 jours)
SELECT 
    COUNT(*) as old_notifications,
    'appointment_notifications (> 30 jours)' as description
FROM appointment_notifications
WHERE created_at < NOW() - INTERVAL '30 days';

-- 14. Vérifier les index inutilisés (PostgreSQL 9.2+)
-- Note: Nécessite pg_stat_user_indexes qui peut ne pas être accessible

-- 15. Résumé de l'espace utilisé
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = current_database();



