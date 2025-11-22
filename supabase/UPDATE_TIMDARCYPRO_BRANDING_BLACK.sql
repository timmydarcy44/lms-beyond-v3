-- Mettre à jour le branding de timdarcypro@gmail.com avec un fond noir
-- Le beige est réservé uniquement à contentin.cabinet@gmail.com

UPDATE public.super_admin_branding
SET 
  primary_color = '#000000',        -- Noir principal
  secondary_color = '#1A1A1A',      -- Noir secondaire
  accent_color = '#6366F1',          -- Violet/Indigo pour les accents
  background_color = '#000000',      -- Fond noir
  surface_color = '#0A0A0A',         -- Surface très sombre
  text_primary_color = '#FFFFFF',    -- Texte blanc
  text_secondary_color = '#A0A0A0', -- Texte gris clair
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM public.profiles 
  WHERE email = 'timdarcypro@gmail.com' 
  LIMIT 1
);

-- Si le branding n'existe pas encore, le créer
INSERT INTO public.super_admin_branding (
  user_id,
  platform_name,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  surface_color,
  text_primary_color,
  text_secondary_color,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'Beyond',
  '#000000',
  '#1A1A1A',
  '#6366F1',
  '#000000',
  '#0A0A0A',
  '#FFFFFF',
  '#A0A0A0',
  NOW(),
  NOW()
FROM public.profiles p
WHERE p.email = 'timdarcypro@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.super_admin_branding 
    WHERE user_id = p.id
  );








