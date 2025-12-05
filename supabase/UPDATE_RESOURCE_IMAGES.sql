-- Mettre à jour les images des ressources
-- =========================================
-- IMPORTANT: Les fichiers sont dans le bucket "Jessica CONTENTIN" (pas "Public")
-- Bucket: "Jessica CONTENTIN"
-- Fichiers confirmés dans le bucket:
--   - Guide_Sommeil.png
--   - Guide_Gestion_Colere.png
--   - Confiance_en_soi_test.png

-- 1. Guide pratique : comprendre et résoudre les problématiques de sommeil des enfants de 3 à 11 ans
-- Note: resources n'a pas de colonne hero_image_url, seulement thumbnail_url et cover_url
UPDATE resources
SET 
  thumbnail_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Sommeil.png',
  cover_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Sommeil.png'
WHERE (title ILIKE '%sommeil%' AND title ILIKE '%3 à 11 ans%')
   OR title ILIKE '%Guide pratique%sommeil%';

-- 2. Comment maitriser la colère de votre enfant en 5 étapes
UPDATE resources
SET 
  thumbnail_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Gestion_Colere.png',
  cover_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Gestion_Colere.png'
WHERE (title ILIKE '%colère%' AND title ILIKE '%5 étapes%')
   OR title ILIKE '%maitriser%colère%';

-- 3. Test de Confiance en soi (dans la table tests)
-- Note: Vérifier si hero_image_url existe avant de l'utiliser
DO $$
BEGIN
  -- Mettre à jour thumbnail_url et cover_image (qui existent toujours)
  UPDATE tests
  SET 
    thumbnail_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Confiance_en_soi_test.png',
    cover_image = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Confiance_en_soi_test.png'
  WHERE title ILIKE '%confiance en soi%'
    OR slug = 'test-confiance-en-soi';
  
  -- Mettre à jour hero_image_url seulement si la colonne existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tests' 
      AND column_name = 'hero_image_url'
  ) THEN
    UPDATE tests
    SET hero_image_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Confiance_en_soi_test.png'
    WHERE title ILIKE '%confiance en soi%'
      OR slug = 'test-confiance-en-soi';
  END IF;
END $$;

-- 4. Mettre à jour aussi les catalog_items correspondants pour le test
UPDATE catalog_items
SET 
  thumbnail_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Confiance_en_soi_test.png',
  hero_image_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Confiance_en_soi_test.png'
WHERE item_type = 'test'
  AND (title ILIKE '%confiance en soi%' OR content_id IN (
    SELECT id FROM tests WHERE title ILIKE '%confiance en soi%' OR slug = 'test-confiance-en-soi'
  ));

-- 5. Mettre à jour aussi les catalog_items correspondants pour les ressources
UPDATE catalog_items
SET 
  thumbnail_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Sommeil.png',
  hero_image_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Sommeil.png'
WHERE item_type = 'ressource'
  AND content_id IN (
    SELECT id FROM resources 
    WHERE title ILIKE '%sommeil%' 
      AND (title ILIKE '%3 à 11 ans%' OR title ILIKE '%Guide pratique%sommeil%')
  );

UPDATE catalog_items
SET 
  thumbnail_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Gestion_Colere.png',
  hero_image_url = 'https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/Guide_Gestion_Colere.png'
WHERE item_type = 'ressource'
  AND content_id IN (
    SELECT id FROM resources 
    WHERE (title ILIKE '%colère%' AND title ILIKE '%5 étapes%')
      OR title ILIKE '%maitriser%colère%'
  );

-- Vérification des mises à jour
SELECT 
  'RESSOURCES' as type,
  id,
  title,
  thumbnail_url,
  cover_url
FROM resources
WHERE title ILIKE '%sommeil%' 
   OR title ILIKE '%colère%'
ORDER BY title;

SELECT 
  'TESTS' as type,
  id,
  title,
  thumbnail_url,
  cover_image
FROM tests
WHERE title ILIKE '%confiance en soi%'
   OR slug = 'test-confiance-en-soi';

SELECT 
  'CATALOG ITEMS' as type,
  ci.id,
  ci.title,
  ci.item_type,
  ci.thumbnail_url,
  ci.hero_image_url
FROM catalog_items ci
LEFT JOIN resources r ON ci.item_type = 'ressource' AND ci.content_id = r.id
LEFT JOIN tests t ON ci.item_type = 'test' AND ci.content_id = t.id
WHERE (r.title ILIKE '%sommeil%' OR r.title ILIKE '%colère%')
   OR (t.title ILIKE '%confiance en soi%' OR t.slug = 'test-confiance-en-soi')
ORDER BY ci.item_type, ci.title;

