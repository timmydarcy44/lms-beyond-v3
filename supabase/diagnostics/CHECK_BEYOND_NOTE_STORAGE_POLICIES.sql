-- Vérifier les policies RLS pour le storage beyond-note
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname LIKE '%beyond-note%' 
    OR policyname LIKE '%Users can upload%'
    OR policyname LIKE '%Users can delete%'
    OR policyname LIKE '%Public can read%'
  )
ORDER BY policyname;

-- Compter le nombre de policies
SELECT 
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname LIKE '%beyond-note%' 
    OR policyname LIKE '%Users can upload%'
    OR policyname LIKE '%Users can delete%'
    OR policyname LIKE '%Public can read%'
  );



