-- Système de branding personnalisé pour Super Admins
-- Permet à chaque Super Admin d'avoir son propre espace avec couleurs, logo, nom
-- =============================================================================

-- 1. Créer la table pour stocker les préférences de branding
CREATE TABLE IF NOT EXISTS public.super_admin_branding (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Identité
  platform_name TEXT NOT NULL DEFAULT 'Beyond',
  platform_logo_url TEXT,
  
  -- Couleurs principales
  primary_color TEXT DEFAULT '#0066FF', -- Bleu par défaut
  secondary_color TEXT DEFAULT '#6366F1', -- Violet par défaut
  accent_color TEXT DEFAULT '#8B5CF6',
  
  -- Couleurs de fond
  background_color TEXT DEFAULT '#FFFFFF',
  surface_color TEXT DEFAULT '#F9FAFB',
  
  -- Couleurs de texte
  text_primary_color TEXT DEFAULT '#1F2937',
  text_secondary_color TEXT DEFAULT '#6B7280',
  
  -- Personnalisation avancée
  font_family TEXT DEFAULT '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
  border_radius TEXT DEFAULT '8px',
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Permissions
  can_create_organizations BOOLEAN DEFAULT FALSE, -- Pour B2C, pas besoin d'organisations
  can_manage_users BOOLEAN DEFAULT TRUE,
  can_manage_content BOOLEAN DEFAULT TRUE,
  can_view_analytics BOOLEAN DEFAULT TRUE,
  
  -- Configuration B2C
  is_b2c_only BOOLEAN DEFAULT TRUE, -- Espace B2C uniquement
  show_organization_features BOOLEAN DEFAULT FALSE -- Masquer les features d'organisation
);

-- Index
CREATE INDEX IF NOT EXISTS idx_super_admin_branding_user_id ON public.super_admin_branding(user_id);

-- 2. Activer RLS
ALTER TABLE public.super_admin_branding ENABLE ROW LEVEL SECURITY;

-- 3. Policies RLS
-- Les Super Admins peuvent voir et modifier leur propre branding
CREATE POLICY super_admin_branding_select ON public.super_admin_branding
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = TRUE
    )
  );

CREATE POLICY super_admin_branding_insert ON public.super_admin_branding
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = TRUE
    )
    AND user_id = auth.uid()
  );

CREATE POLICY super_admin_branding_update ON public.super_admin_branding
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = TRUE
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = TRUE
    )
    AND user_id = auth.uid()
  );

-- 4. Fonction pour obtenir le branding d'un Super Admin
CREATE OR REPLACE FUNCTION get_super_admin_branding(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  user_id UUID,
  platform_name TEXT,
  platform_logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background_color TEXT,
  surface_color TEXT,
  text_primary_color TEXT,
  text_secondary_color TEXT,
  font_family TEXT,
  border_radius TEXT,
  can_create_organizations BOOLEAN,
  can_manage_users BOOLEAN,
  can_manage_content BOOLEAN,
  can_view_analytics BOOLEAN,
  is_b2c_only BOOLEAN,
  show_organization_features BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.user_id,
    b.platform_name,
    b.platform_logo_url,
    b.primary_color,
    b.secondary_color,
    b.accent_color,
    b.background_color,
    b.surface_color,
    b.text_primary_color,
    b.text_secondary_color,
    b.font_family,
    b.border_radius,
    b.can_create_organizations,
    b.can_manage_users,
    b.can_manage_content,
    b.can_view_analytics,
    b.is_b2c_only,
    b.show_organization_features
  FROM public.super_admin_branding b
  WHERE b.user_id = p_user_id;
END;
$$;

-- 5. Ajouter contentin.cabinet@gmail.com comme Super Admin si elle n'existe pas déjà
DO $$
DECLARE
  v_user_id UUID;
  v_branding_exists BOOLEAN;
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = 'contentin.cabinet@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Vérifier si elle est déjà super admin
    IF NOT EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = v_user_id
    ) THEN
      -- Ajouter comme Super Admin
      INSERT INTO public.super_admins (user_id, created_by, notes, is_active)
      VALUES (
        v_user_id,
        (SELECT id FROM public.profiles WHERE email = 'timdarcypro@gmail.com' LIMIT 1),
        'Espace Super Admin B2C pour contentin.cabinet@gmail.com',
        TRUE
      );
      
      RAISE NOTICE 'Super Admin ajouté: contentin.cabinet@gmail.com (%)', v_user_id;
    ELSE
      RAISE NOTICE 'Super Admin existe déjà: contentin.cabinet@gmail.com';
    END IF;
    
    -- Vérifier si le branding existe
    SELECT EXISTS (
      SELECT 1 FROM public.super_admin_branding
      WHERE user_id = v_user_id
    ) INTO v_branding_exists;
    
    -- Créer le branding par défaut pour contentin.cabinet@gmail.com
    IF NOT v_branding_exists THEN
      INSERT INTO public.super_admin_branding (
        user_id,
        platform_name,
        primary_color,
        secondary_color,
        accent_color,
        is_b2c_only,
        show_organization_features,
        can_create_organizations
      )
      VALUES (
        v_user_id,
        'Cabinet Contentin', -- Nom de la plateforme
        '#8B5CF6', -- Violet pour différencier
        '#A78BFA',
        '#C4B5FD',
        TRUE, -- B2C uniquement
        FALSE, -- Masquer les features d'organisation
        FALSE -- Ne peut pas créer d'organisations
      );
      
      RAISE NOTICE 'Branding créé pour contentin.cabinet@gmail.com';
    ELSE
      RAISE NOTICE 'Branding existe déjà pour contentin.cabinet@gmail.com';
    END IF;
  ELSE
    RAISE NOTICE 'Utilisateur non trouvé: contentin.cabinet@gmail.com';
  END IF;
END $$;

-- 6. Vérifier les résultats
SELECT 
  'SUPER ADMINS' as "Info",
  p.email,
  p.full_name,
  sa.is_active,
  b.platform_name,
  b.is_b2c_only
FROM public.super_admins sa
JOIN public.profiles p ON p.id = sa.user_id
LEFT JOIN public.super_admin_branding b ON b.user_id = sa.user_id
WHERE p.email IN ('timdarcypro@gmail.com', 'contentin.cabinet@gmail.com')
ORDER BY p.email;



