-- Créer l'item de catalogue pour le Test de Confiance en soi
-- =================================================================
-- Note: Le test de confiance en soi est un test personnalisé qui n'utilise pas
-- la table tests classique. Nous créons un test factice dans la table tests
-- uniquement pour avoir un UUID à référencer dans catalog_items.

DO $$
DECLARE
    jessica_profile_id UUID;
    jessica_org_id UUID;
    test_id UUID;
    test_catalog_item_id UUID;
    test_slug TEXT := 'test-confiance-en-soi';
    has_published_column BOOLEAN;
    has_org_id_column BOOLEAN;
    has_owner_id_column BOOLEAN;
BEGIN
    -- Trouver l'ID de Jessica Contentin
    SELECT id INTO jessica_profile_id
    FROM profiles
    WHERE email = 'contentin.cabinet@gmail.com'
    LIMIT 1;

    IF jessica_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profil Jessica Contentin introuvable';
    END IF;

    -- Vérifier si la colonne org_id existe et est NOT NULL
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tests' 
        AND column_name = 'org_id'
    ) INTO has_org_id_column;

    -- Vérifier si la colonne owner_id existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tests' 
        AND column_name = 'owner_id'
    ) INTO has_owner_id_column;

    -- Si org_id existe, trouver l'organisation de Jessica (plusieurs méthodes)
    IF has_org_id_column THEN
        -- Méthode 1: Via org_memberships
        SELECT org_id INTO jessica_org_id
        FROM org_memberships
        WHERE user_id = jessica_profile_id
        LIMIT 1;

        -- Méthode 2: Via organizations.creator_id
        IF jessica_org_id IS NULL THEN
            SELECT id INTO jessica_org_id
            FROM organizations
            WHERE creator_id = jessica_profile_id
            LIMIT 1;
        END IF;

        -- Méthode 3: Via les tests existants de Jessica
        IF jessica_org_id IS NULL THEN
            SELECT org_id INTO jessica_org_id
            FROM tests
            WHERE creator_id = jessica_profile_id
              AND org_id IS NOT NULL
            LIMIT 1;
        END IF;

        -- Méthode 4: Via les courses existants de Jessica
        IF jessica_org_id IS NULL THEN
            SELECT org_id INTO jessica_org_id
            FROM courses
            WHERE creator_id = jessica_profile_id
              AND org_id IS NOT NULL
            LIMIT 1;
        END IF;

        -- Méthode 5: Via les resources existantes de Jessica
        IF jessica_org_id IS NULL THEN
            SELECT org_id INTO jessica_org_id
            FROM resources
            WHERE creator_id = jessica_profile_id
              AND org_id IS NOT NULL
            LIMIT 1;
        END IF;

        -- Si toujours pas trouvé, lever une exception
        IF jessica_org_id IS NULL THEN
            RAISE EXCEPTION 'Aucune organisation trouvée pour Jessica (contentin.cabinet@gmail.com). Veuillez vérifier que Jessica est bien membre d''une organisation ou qu''elle a créé une organisation.';
        ELSE
            RAISE NOTICE 'Organisation trouvée pour Jessica: %', jessica_org_id;
        END IF;
    END IF;

    -- Vérifier si la colonne published existe dans tests
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tests' 
        AND column_name = 'published'
    ) INTO has_published_column;

    -- Vérifier si le test existe déjà dans la table tests
    SELECT id INTO test_id
    FROM tests
    WHERE slug = test_slug
    LIMIT 1;

    -- Si le test n'existe pas, le créer
    IF test_id IS NULL THEN
        -- Construire l'INSERT selon les colonnes disponibles
        -- owner_id doit être égal à creator_id (Jessica)
        IF has_published_column AND has_org_id_column AND has_owner_id_column AND jessica_org_id IS NOT NULL THEN
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                owner_id,
                org_id,
                published,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                jessica_profile_id, -- owner_id = creator_id
                jessica_org_id,
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        ELSIF has_published_column AND has_org_id_column AND jessica_org_id IS NOT NULL THEN
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                org_id,
                published,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                jessica_org_id,
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        ELSIF has_published_column AND has_org_id_column AND has_owner_id_column THEN
            -- org_id est NOT NULL mais pas trouvé, on doit créer une organisation ou utiliser une valeur par défaut
            RAISE EXCEPTION 'org_id est requis mais aucune organisation trouvée pour Jessica. Veuillez d''abord créer une organisation ou ajouter Jessica à une organisation existante.';
        ELSIF has_published_column AND has_owner_id_column THEN
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                owner_id,
                published,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                jessica_profile_id, -- owner_id = creator_id
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        ELSIF has_org_id_column AND has_owner_id_column AND jessica_org_id IS NOT NULL THEN
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                owner_id,
                org_id,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                jessica_profile_id, -- owner_id = creator_id
                jessica_org_id,
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        ELSIF has_org_id_column AND has_owner_id_column THEN
            RAISE EXCEPTION 'org_id est requis mais aucune organisation trouvée pour Jessica. Veuillez d''abord créer une organisation ou ajouter Jessica à une organisation existante.';
        ELSIF has_owner_id_column THEN
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                owner_id,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                jessica_profile_id, -- owner_id = creator_id
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        ELSIF has_published_column THEN
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                published,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        ELSIF has_org_id_column AND jessica_org_id IS NOT NULL THEN
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                org_id,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                jessica_org_id,
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        ELSIF has_org_id_column THEN
            RAISE EXCEPTION 'org_id est requis mais aucune organisation trouvée pour Jessica. Veuillez d''abord créer une organisation ou ajouter Jessica à une organisation existante.';
        ELSE
            INSERT INTO tests (
                id,
                slug,
                title,
                description,
                status,
                kind,
                creator_id,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                test_slug,
                'Test de Confiance en soi',
                'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
                'published',
                'quiz',
                jessica_profile_id,
                NOW(),
                NOW()
            )
            RETURNING id INTO test_id;
        END IF;

        RAISE NOTICE 'Test créé dans la table tests avec l''ID: %', test_id;
    ELSE
        RAISE NOTICE 'Test existe déjà dans la table tests avec l''ID: %', test_id;
    END IF;

    -- Vérifier si l'item de catalogue existe déjà (en utilisant l'UUID du test)
    SELECT id INTO test_catalog_item_id
    FROM catalog_items
    WHERE content_id = test_id
      AND creator_id = jessica_profile_id
      AND item_type = 'test'
    LIMIT 1;

    -- Si l'item n'existe pas, le créer
    IF test_catalog_item_id IS NULL THEN
        INSERT INTO catalog_items (
            id,
            title,
            description,
            item_type,
            content_id,
            creator_id,
            created_by,
            price,
            is_free,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Test de Confiance en soi',
            'Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant avec analyse IA.',
            'test',
            test_id, -- Utiliser l'UUID du test créé (pas le slug)
            jessica_profile_id,
            jessica_profile_id, -- created_by = creator_id
            0, -- Prix par défaut (peut être modifié)
            false, -- Pas gratuit par défaut (nécessite un achat ou un accès manuel)
            true, -- Actif
            NOW(),
            NOW()
        )
        RETURNING id INTO test_catalog_item_id;

        RAISE NOTICE 'Item de catalogue créé avec l''ID: %', test_catalog_item_id;
    ELSE
        RAISE NOTICE 'Item de catalogue existe déjà avec l''ID: %', test_catalog_item_id;
    END IF;
END $$;

