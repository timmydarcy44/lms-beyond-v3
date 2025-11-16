-- Script de vérification pour Beyond Note
-- Exécutez ce script pour vérifier que tout est configuré correctement

-- 1. Vérifier que les tables existent
SELECT 
  'Tables' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beyond_note_documents')
    THEN '✅ beyond_note_documents existe'
    ELSE '❌ beyond_note_documents MANQUANTE'
  END as status
UNION ALL
SELECT 
  'Tables',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beyond_note_ai_results')
    THEN '✅ beyond_note_ai_results existe'
    ELSE '❌ beyond_note_ai_results MANQUANTE'
  END;

-- 2. Vérifier que le bucket existe
SELECT 
  'Storage' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'beyond-note')
    THEN '✅ Bucket beyond-note existe'
    ELSE '❌ Bucket beyond-note MANQUANT - Créez-le dans Supabase Dashboard > Storage'
  END as status;

-- 3. Vérifier les policies RLS pour les tables
SELECT 
  'RLS Policies (Tables)' as check_type,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Policies RLS configurées (' || COUNT(*) || ' policies)'
    ELSE '❌ Policies RLS manquantes (' || COUNT(*) || ' policies trouvées, 4 attendues)'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'beyond_note_documents';

-- 4. Vérifier les policies RLS pour le storage
SELECT 
  'RLS Policies (Storage)' as check_type,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ Policies Storage configurées (' || COUNT(*) || ' policies)'
    ELSE '❌ Policies Storage manquantes (' || COUNT(*) || ' policies trouvées, 3 attendues)'
  END as status
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%beyond-note%' OR policyname LIKE '%Users can%' OR policyname LIKE '%Public can%');

-- 5. Afficher les détails du bucket si il existe
SELECT 
  'Bucket Details' as check_type,
  id || ' - Public: ' || public::text || ' - Size limit: ' || COALESCE(file_size_limit::text, 'unlimited') as status
FROM storage.buckets 
WHERE id = 'beyond-note';

