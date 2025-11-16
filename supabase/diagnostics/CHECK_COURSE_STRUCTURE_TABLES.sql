-- Vérification des tables et colonnes nécessaires pour la génération de structure de formation

-- 1. Vérifier la table courses et la colonne builder_snapshot
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'courses'
    AND column_name IN ('builder_snapshot', 'title', 'description', 'status', 'published')
ORDER BY ordinal_position;

-- 2. Vérifier si builder_snapshot existe et son type
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'builder_snapshot'
    ) as builder_snapshot_exists;

-- 3. Vérifier le type de builder_snapshot (devrait être JSONB)
SELECT 
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'courses'
    AND column_name = 'builder_snapshot';

-- 4. Vérifier la structure attendue (exemple de snapshot)
-- Le snapshot devrait contenir :
-- {
--   "sections": [
--     {
--       "id": "string",
--       "title": "string",
--       "description": "string",
--       "order": number,
--       "chapters": [
--         {
--           "id": "string",
--           "title": "string",
--           "summary": "string",
--           "content": "string",
--           "duration": "string",
--           "type": "video|text|document|audio",
--           "order": number,
--           "subchapters": [...]
--         }
--       ]
--     }
--   ],
--   "general": {
--     "title": "string",
--     "description": "string",
--     ...
--   }
-- }

-- 5. Vérifier si la colonne existe dans d'autres tables potentielles
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'builder_snapshot'
ORDER BY table_name;

-- 6. Lister toutes les colonnes de la table courses pour référence
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;




