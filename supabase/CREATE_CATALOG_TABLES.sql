-- Tables pour le système de catalogue BEYOND
-- Le Super Admin crée des contenus qui sont disponibles dans le catalogue
-- Les organisations peuvent les acheter ou recevoir un accès manuel

-- Table des items du catalogue
CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de contenu (module, parcours, ressource, test)
  item_type TEXT NOT NULL CHECK (item_type IN ('module', 'parcours', 'ressource', 'test')),
  
  -- Référence au contenu réel
  content_id UUID NOT NULL, -- Référence vers courses, paths, resources, ou tests
  
  -- Informations du catalogue
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  hero_image_url TEXT,
  thumbnail_url TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'EUR',
  
  -- Métadonnées
  category TEXT, -- Ex: "Leadership", "Neurosciences", etc.
  tags TEXT[], -- Array de tags
  duration TEXT, -- Durée estimée (ex: "6 heures", "12 semaines")
  level TEXT, -- Débutant, Intermédiaire, Expert
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Pour mettre en avant dans le hero
  
  -- Créateur (toujours un Super Admin)
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON catalog_items(item_type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_active ON catalog_items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_catalog_items_featured ON catalog_items(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items(category);

-- Table des accès au catalogue par organisation
CREATE TABLE IF NOT EXISTS catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organisation qui a accès
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Item du catalogue
  catalog_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  
  -- Statut d'accès
  access_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
    access_status IN ('pending_payment', 'purchased', 'manually_granted', 'free', 'expired')
  ),
  
  -- Si achat, information de transaction (à compléter avec système de paiement)
  transaction_id TEXT,
  purchase_amount DECIMAL(10, 2),
  purchase_date TIMESTAMP WITH TIME ZONE,
  
  -- Si accès manuel, qui l'a accordé
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE,
  grant_reason TEXT, -- Raison de l'accès gratuit (ex: "Partenaire", "Beta test", etc.)
  
  -- Expiration (optionnel, pour accès temporaires)
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un accès unique par organisation et item
  UNIQUE(organization_id, catalog_item_id)
);

-- Index pour les recherches d'accès
CREATE INDEX IF NOT EXISTS idx_catalog_access_org ON catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_access_item ON catalog_access(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_catalog_access_status ON catalog_access(access_status);
CREATE INDEX IF NOT EXISTS idx_catalog_access_active ON catalog_access(organization_id, access_status) 
  WHERE access_status IN ('purchased', 'manually_granted', 'free');

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_catalog_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_catalog_items_updated_at
  BEFORE UPDATE ON catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_items_updated_at();

CREATE TRIGGER trigger_update_catalog_access_updated_at
  BEFORE UPDATE ON catalog_access
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_items_updated_at();

-- RLS Policies pour catalog_items (lecture publique, écriture Super Admin uniquement)
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les items actifs du catalogue
CREATE POLICY "catalog_items_select_active"
  ON catalog_items
  FOR SELECT
  USING (is_active = true);

-- Seuls les Super Admins peuvent créer/modifier les items
CREATE POLICY "catalog_items_insert_super_admin"
  ON catalog_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "catalog_items_update_super_admin"
  ON catalog_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policies pour catalog_access
ALTER TABLE catalog_access ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les accès de leur organisation
CREATE POLICY "catalog_access_select_org_members"
  ON catalog_access
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Les Super Admins peuvent tout voir et modifier
CREATE POLICY "catalog_access_all_super_admin"
  ON catalog_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Commentaires
COMMENT ON TABLE catalog_items IS 'Contenu disponible dans le catalogue BEYOND, créé par les Super Admins';
COMMENT ON TABLE catalog_access IS 'Gestion des accès des organisations aux items du catalogue (achat ou accès manuel)';
COMMENT ON COLUMN catalog_items.item_type IS 'Type de contenu: module, parcours, ressource, ou test';
COMMENT ON COLUMN catalog_access.access_status IS 'Statut: pending_payment, purchased, manually_granted, free, expired';

