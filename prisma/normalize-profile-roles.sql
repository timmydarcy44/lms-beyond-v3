-- Nettoyage des roles avant migration vers l'ENUM ProfileRole
-- Mappe les anciens roles vers les valeurs cibles

UPDATE public.profiles
SET role = CASE
  WHEN role IS NULL OR btrim(role) = '' THEN 'PARTICULIER'
  ELSE upper(role)
END;

UPDATE public.profiles
SET role = CASE
  WHEN role IN ('USER', 'CLIENT', 'PARTICULIER') THEN 'PARTICULIER'
  WHEN role IN ('ADMIN', 'SUPERADMIN') THEN 'ADMIN'
  ELSE role
END;
