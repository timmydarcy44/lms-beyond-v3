-- Migration pour ajouter le champ stripe_checkout_url à catalog_items
-- Cela permet de configurer une URL Stripe Checkout personnalisée pour chaque produit

-- Ajouter la colonne stripe_checkout_url si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'catalog_items' 
    AND column_name = 'stripe_checkout_url'
  ) THEN
    ALTER TABLE catalog_items 
    ADD COLUMN stripe_checkout_url TEXT;
    
    COMMENT ON COLUMN catalog_items.stripe_checkout_url IS 'URL Stripe Checkout personnalisée pour ce produit (ex: https://buy.stripe.com/...)';
  END IF;
END $$;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_catalog_items_stripe_checkout_url 
ON catalog_items(stripe_checkout_url) 
WHERE stripe_checkout_url IS NOT NULL;


