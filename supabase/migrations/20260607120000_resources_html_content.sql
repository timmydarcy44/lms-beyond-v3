-- Contenu HTML intégré pour les ressources formateur (alternative à l'upload fichier)
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS html_content text;

COMMENT ON COLUMN public.resources.html_content IS 'Contenu HTML embarqué lorsque kind/type = html';
