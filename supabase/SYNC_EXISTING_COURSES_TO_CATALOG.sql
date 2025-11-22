-- Synchroniser les modules existants avec catalog_items
-- Pour les Super Admins qui ont des modules publiés mais pas dans catalog_items

DO $$
DECLARE
    course_record RECORD;
    super_admin_id UUID;
    catalog_item_id UUID;
BEGIN
    -- Parcourir tous les cours publiés
    FOR course_record IN 
        SELECT 
            c.id,
            c.title,
            c.description,
            c.cover_image,
            c.builder_snapshot,
            c.price,
            c.creator_id,
            c.status
        FROM courses c
        WHERE c.status = 'published'
        AND c.creator_id IN (
            SELECT user_id FROM super_admins WHERE is_active = true
        )
    LOOP
        -- Vérifier si le créateur est un Super Admin
        SELECT user_id INTO super_admin_id
        FROM super_admins
        WHERE user_id = course_record.creator_id
        AND is_active = true
        LIMIT 1;
        
        IF super_admin_id IS NOT NULL THEN
            -- Vérifier si un catalog_item existe déjà
            SELECT id INTO catalog_item_id
            FROM catalog_items
            WHERE content_id = course_record.id
            AND item_type = 'module'
            LIMIT 1;
            
            -- Extraire les données du builder_snapshot
            DECLARE
                snapshot_data JSONB;
                general_data JSONB;
                hero_image TEXT;
                category TEXT;
                target_audience TEXT;
                price_value NUMERIC;
            BEGIN
                snapshot_data := course_record.builder_snapshot;
                
                IF snapshot_data IS NOT NULL THEN
                    general_data := snapshot_data->'general';
                    
                    IF general_data IS NOT NULL THEN
                        hero_image := general_data->>'heroImage';
                        category := general_data->>'category';
                        target_audience := general_data->>'target_audience';
                        price_value := (general_data->>'price')::NUMERIC;
                    END IF;
                END IF;
                
                -- Utiliser les valeurs du snapshot ou les valeurs par défaut
                hero_image := COALESCE(hero_image, course_record.cover_image);
                category := COALESCE(category, '');
                target_audience := COALESCE(target_audience, 'all');
                price_value := COALESCE(price_value, course_record.price, 0);
                
                IF catalog_item_id IS NULL THEN
                    -- Créer un nouvel item
                    INSERT INTO catalog_items (
                        content_id,
                        item_type,
                        title,
                        description,
                        short_description,
                        price,
                        is_free,
                        category,
                        hero_image_url,
                        thumbnail_url,
                        target_audience,
                        creator_id,
                        is_active,
                        created_at,
                        updated_at
                    ) VALUES (
                        course_record.id,
                        'module',
                        course_record.title,
                        course_record.description,
                        course_record.description,
                        price_value,
                        (price_value = 0 OR price_value IS NULL),
                        NULLIF(category, ''),
                        hero_image,
                        hero_image,
                        target_audience,
                        super_admin_id,
                        true,
                        NOW(),
                        NOW()
                    );
                    
                    RAISE NOTICE '✅ Catalog item créé pour le module: % (course_id: %)', course_record.title, course_record.id;
                ELSE
                    -- Mettre à jour l'item existant
                    UPDATE catalog_items
                    SET
                        title = course_record.title,
                        description = course_record.description,
                        short_description = course_record.description,
                        price = price_value,
                        is_free = (price_value = 0 OR price_value IS NULL),
                        category = NULLIF(category, ''),
                        hero_image_url = COALESCE(hero_image, hero_image_url),
                        thumbnail_url = COALESCE(hero_image, thumbnail_url),
                        target_audience = target_audience,
                        creator_id = super_admin_id,
                        updated_at = NOW()
                    WHERE id = catalog_item_id;
                    
                    RAISE NOTICE '✅ Catalog item mis à jour pour le module: % (catalog_item_id: %)', course_record.title, catalog_item_id;
                END IF;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Synchronisation terminée.';
END $$;








