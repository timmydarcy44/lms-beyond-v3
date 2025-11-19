-- ============================================
-- AJOUTER DES COLONNES POUR STOCKER LES IDs LOCAUX DU BUILDER
-- ============================================

-- Ajouter des colonnes texte pour stocker les IDs locaux (nanoids) du builder
-- Ces IDs sont utilisés pour positionner les tests dans le builder_snapshot
ALTER TABLE public.course_tests 
  ADD COLUMN IF NOT EXISTS local_section_id TEXT,
  ADD COLUMN IF NOT EXISTS local_chapter_id TEXT,
  ADD COLUMN IF NOT EXISTS local_subchapter_id TEXT,
  ADD COLUMN IF NOT EXISTS local_position_after_id TEXT;

-- Ajouter des commentaires pour clarifier l'utilisation
COMMENT ON COLUMN public.course_tests.local_section_id IS 'ID local (nanoid) de la section dans le builder_snapshot';
COMMENT ON COLUMN public.course_tests.local_chapter_id IS 'ID local (nanoid) du chapitre dans le builder_snapshot';
COMMENT ON COLUMN public.course_tests.local_subchapter_id IS 'ID local (nanoid) du sous-chapitre dans le builder_snapshot';
COMMENT ON COLUMN public.course_tests.local_position_after_id IS 'ID local (nanoid) de l''élément après lequel positionner le test';

