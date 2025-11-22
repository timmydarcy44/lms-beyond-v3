-- Mettre à jour le branding de contentin.cabinet@gmail.com
-- Couleurs : blanc, marron, beige, doré - classe, élégant, apaisant
-- =================================================================

DO $$
DECLARE
  v_contentin_id UUID;
BEGIN
  -- Récupérer l'ID de contentin.cabinet@gmail.com
  SELECT id INTO v_contentin_id
  FROM profiles
  WHERE email = 'contentin.cabinet@gmail.com';
  
  IF v_contentin_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur contentin.cabinet@gmail.com non trouvé';
  END IF;
  
  -- Mettre à jour ou créer le branding
  INSERT INTO super_admin_branding (
    user_id,
    platform_name,
    platform_logo_url,
    primary_color,      -- Marron principal
    secondary_color,    -- Beige
    accent_color,        -- Doré
    background_color,    -- Blanc
    surface_color,       -- Beige très clair
    text_primary_color, -- Marron foncé
    text_secondary_color, -- Marron moyen
    font_family,
    border_radius,
    is_b2c_only,
    show_organization_features,
    can_create_organizations
  )
  VALUES (
    v_contentin_id,
    'Cabinet Contentin',
    NULL,
    '#8B6F47',      -- Marron élégant (primary)
    '#D4C4A8',      -- Beige doux (secondary)
    '#D4AF37',      -- Doré classique (accent)
    '#FFFFFF',      -- Blanc pur (background)
    '#F5F1E8',      -- Beige très clair (surface)
    '#5C4A37',      -- Marron foncé (text primary)
    '#8B7355',      -- Marron moyen (text secondary)
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    '8px',
    TRUE,
    FALSE,
    FALSE
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    platform_name = EXCLUDED.platform_name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    background_color = EXCLUDED.background_color,
    surface_color = EXCLUDED.surface_color,
    text_primary_color = EXCLUDED.text_primary_color,
    text_secondary_color = EXCLUDED.text_secondary_color,
    updated_at = NOW();
  
  RAISE NOTICE 'Branding mis à jour pour contentin.cabinet@gmail.com';
END $$;

-- Vérifier le branding
SELECT 
  'BRANDING CONTENTIN' as "Info",
  p.email,
  b.platform_name,
  b.primary_color,
  b.secondary_color,
  b.accent_color,
  b.background_color,
  b.surface_color
FROM super_admin_branding b
JOIN profiles p ON p.id = b.user_id
WHERE p.email = 'contentin.cabinet@gmail.com';








