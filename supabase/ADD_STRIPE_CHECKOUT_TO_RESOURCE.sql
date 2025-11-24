-- Script pour ajouter l'URL Stripe Checkout à la ressource "Pourquoi les enfants se mettent il en colère ?"
-- Exécutez d'abord la migration 008_add_stripe_checkout_url_to_catalog.sql

-- 1. Trouver la ressource et son catalog_item
DO $$
DECLARE
    v_resource_id UUID;
    v_catalog_item_id UUID;
BEGIN
    -- Trouver la ressource par titre
    SELECT id INTO v_resource_id
    FROM resources
    WHERE title ILIKE '%pourquoi les enfants se mettent%'
       OR title ILIKE '%colère%'
       OR title ILIKE '%colere%'
    LIMIT 1;

    IF v_resource_id IS NULL THEN
        RAISE NOTICE '⚠️ Ressource "Pourquoi les enfants se mettent il en colère ?" non trouvée';
        RAISE NOTICE 'Vérifiez le titre exact dans la table resources';
    ELSE
        RAISE NOTICE '✅ Ressource trouvée: %', v_resource_id;
        
        -- Trouver le catalog_item correspondant
        SELECT id INTO v_catalog_item_id
        FROM catalog_items
        WHERE content_id = v_resource_id
          AND item_type = 'ressource'
        LIMIT 1;

        IF v_catalog_item_id IS NULL THEN
            RAISE NOTICE '⚠️ Catalog item non trouvé pour cette ressource';
        ELSE
            RAISE NOTICE '✅ Catalog item trouvé: %', v_catalog_item_id;
            
            -- Mettre à jour avec l'URL Stripe Checkout
            UPDATE catalog_items
            SET stripe_checkout_url = 'https://buy.stripe.com/dRmdRaeay8Ni8Sg8bh33W01'
            WHERE id = v_catalog_item_id;
            
            RAISE NOTICE '✅ URL Stripe Checkout ajoutée au catalog item: %', v_catalog_item_id;
        END IF;
    END IF;
END $$;

-- Vérification
SELECT 
    ci.id,
    ci.title,
    ci.price,
    ci.stripe_checkout_url,
    r.title as resource_title
FROM catalog_items ci
LEFT JOIN resources r ON r.id = ci.content_id
WHERE ci.stripe_checkout_url IS NOT NULL
ORDER BY ci.updated_at DESC;


