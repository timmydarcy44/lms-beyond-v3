-- Mettre à jour le branding de contentin.cabinet@gmail.com avec des couleurs chaudes et chaleureuses
-- ================================================================================================

UPDATE public.super_admin_branding
SET 
  primary_color = '#8B6F47',        -- Marron chaud
  secondary_color = '#D4C4A8',      -- Beige doux
  accent_color = '#D4AF37',         -- Doré élégant
  background_color = '#F5F0E8',     -- Beige clair
  surface_color = '#F5F0E8',        -- Beige très clair
  text_primary_color = '#5D4037',   -- Marron foncé pour le texte
  text_secondary_color = '#8B6F47', -- Marron moyen
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'contentin.cabinet@gmail.com'
);

-- Vérifier le résultat
SELECT 
  'BRANDING CONTENTIN' as "Info",
  p.email,
  b.platform_name,
  b.primary_color,
  b.secondary_color,
  b.accent_color,
  b.background_color,
  b.surface_color,
  b.text_primary_color,
  b.text_secondary_color
FROM public.super_admin_branding b
JOIN public.profiles p ON p.id = b.user_id
WHERE p.email = 'contentin.cabinet@gmail.com';

