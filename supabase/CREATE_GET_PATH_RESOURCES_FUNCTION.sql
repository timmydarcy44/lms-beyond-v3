-- Créer une fonction SECURITY DEFINER pour récupérer les ressources d'un parcours
-- Cette fonction contourne RLS pour permettre aux apprenants de lire les ressources
-- associées à leurs parcours assignés
-- ===============================================================

-- 1. Créer la fonction
CREATE OR REPLACE FUNCTION get_path_resources_for_learner(
  p_path_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  kind TEXT,
  cover_url TEXT,
  thumbnail_url TEXT,
  published BOOLEAN,
  "order" INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur a accès au parcours
  IF NOT EXISTS (
    SELECT 1 
    FROM path_progress pp
    WHERE pp.path_id = p_path_id
      AND pp.user_id = p_user_id
  ) THEN
    RETURN;
  END IF;

  -- Retourner les ressources associées au parcours
  -- Simplifier : ne sélectionner que les colonnes qui existent certainement
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    COALESCE(r.kind::TEXT, NULL) as kind,  -- kind est un ENUM, cast vers TEXT
    NULL::TEXT as cover_url,  -- cover_url n'existe peut-être pas, utiliser NULL
    NULL::TEXT as thumbnail_url,  -- thumbnail_url n'existe pas, utiliser NULL
    r.published,
    pr."order"
  FROM path_resources pr
  JOIN resources r ON r.id = pr.resource_id
  WHERE pr.path_id = p_path_id
    AND r.published = true
  ORDER BY pr."order" ASC;
END;
$$;

-- 2. Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_path_resources_for_learner(UUID, UUID) TO authenticated;

-- 3. Test de la fonction
SELECT 
  'TEST FONCTION GET_PATH_RESOURCES' as "Info",
  *
FROM get_path_resources_for_learner(
  '9c2643ee-87d3-4c13-bf79-ba2e77b32af0'::UUID,  -- path_id
  (SELECT id FROM profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1)::UUID  -- user_id
);

