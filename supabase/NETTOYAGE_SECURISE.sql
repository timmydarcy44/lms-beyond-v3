-- Script de nettoyage SÉCURISÉ pour Supabase
-- ⚠️ ATTENTION: Ce script supprime des données. Exécutez d'abord DIAGNOSTIC_NETTOYAGE.sql
-- ⚠️ Faites un backup avant d'exécuter ce script

-- ============================================
-- NETTOYAGE DES SESSIONS AUTH (Sécurisé)
-- ============================================

-- Supprimer les anciennes sessions auth (plus de 30 jours)
-- Ces sessions sont automatiquement nettoyées par Supabase, mais on peut accélérer
DELETE FROM auth.sessions
WHERE created_at < NOW() - INTERVAL '30 days'
  AND id NOT IN (
    -- Garder les sessions actives (utilisées récemment)
    SELECT id FROM auth.sessions 
    WHERE updated_at > NOW() - INTERVAL '7 days'
  );

-- Supprimer les anciens refresh tokens (plus de 30 jours)
DELETE FROM auth.refresh_tokens
WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================
-- NETTOYAGE DES DONNÉES MÉTIER (Sécurisé)
-- ============================================

-- Supprimer les anciens catalog_items inactifs (plus de 180 jours)
-- Ces items ne sont plus utilisés et prennent de l'espace
DELETE FROM catalog_items
WHERE is_active = false 
  AND updated_at < NOW() - INTERVAL '180 days';

-- Supprimer les anciennes formations en brouillon (plus de 180 jours)
-- Si une formation est restée en brouillon 6 mois, elle n'est probablement plus nécessaire
DELETE FROM courses
WHERE status = 'draft' 
  AND created_at < NOW() - INTERVAL '180 days'
  AND id NOT IN (
    -- Garder les formations qui ont des catalog_items associés
    SELECT DISTINCT content_id FROM catalog_items WHERE item_type = 'module'
  );

-- Supprimer les anciens tests en brouillon (plus de 180 jours)
DELETE FROM tests
WHERE status = 'draft' 
  AND created_at < NOW() - INTERVAL '180 days'
  AND id NOT IN (
    -- Garder les tests qui ont des catalog_items associés
    SELECT DISTINCT content_id FROM catalog_items WHERE item_type = 'test'
  );

-- Supprimer les anciennes ressources en brouillon (plus de 180 jours)
DELETE FROM resources
WHERE status = 'draft' 
  AND created_at < NOW() - INTERVAL '180 days'
  AND id NOT IN (
    -- Garder les ressources qui ont des catalog_items associés
    SELECT DISTINCT content_id FROM catalog_items WHERE item_type = 'resource'
  );

-- ============================================
-- NETTOYAGE DES TODOS (Sécurisé)
-- ============================================

-- Supprimer les todos complétés depuis plus de 90 jours
DELETE FROM todo_tasks
WHERE completed = true 
  AND updated_at < NOW() - INTERVAL '90 days';

-- ============================================
-- NETTOYAGE DES INTERACTIONS IA (Sécurisé)
-- ============================================

-- Supprimer les anciennes interactions IA (plus de 180 jours)
-- Ces logs peuvent être volumineux mais ne sont plus nécessaires après 6 mois
DELETE FROM ai_interactions
WHERE created_at < NOW() - INTERVAL '180 days';

-- ============================================
-- NETTOYAGE DES FLASHCARDS (Sécurisé)
-- ============================================

-- Supprimer les flashcards jamais révisés depuis plus de 180 jours
-- Si un flashcard n'a jamais été révisé en 6 mois, il n'est probablement plus utilisé
DELETE FROM flashcards
WHERE last_reviewed_at IS NULL 
  AND created_at < NOW() - INTERVAL '180 days';

-- ============================================
-- NETTOYAGE DES RENDEZ-VOUS (Sécurisé)
-- ============================================

-- Supprimer les anciens rendez-vous passés (plus de 180 jours)
-- Les rendez-vous très anciens ne sont plus nécessaires
DELETE FROM appointments
WHERE appointment_date < NOW() - INTERVAL '180 days';

-- Supprimer les anciennes notifications (plus de 90 jours)
DELETE FROM appointment_notifications
WHERE created_at < NOW() - INTERVAL '90 days';

-- ============================================
-- VACUUM (Optimisation)
-- ============================================

-- Libérer l'espace après suppression (PostgreSQL)
-- Note: VACUUM peut prendre du temps sur de grandes tables
VACUUM ANALYZE;

-- Afficher l'espace libéré
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size_after_cleanup
FROM pg_database
WHERE datname = current_database();



