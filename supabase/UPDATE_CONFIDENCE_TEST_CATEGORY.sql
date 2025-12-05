-- Mettre à jour la catégorie du test de confiance en soi pour "Soft skills"
UPDATE catalog_items
SET category = 'Soft skills'
WHERE title = 'Test de Confiance en soi'
  AND item_type = 'test';

-- Mettre à jour aussi dans la table tests si elle a une colonne category
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' 
        AND column_name = 'category'
    ) THEN
        UPDATE tests
        SET category = 'Soft skills'
        WHERE title = 'Test de Confiance en soi'
          OR slug = 'test-confiance-en-soi';
    END IF;
END $$;

