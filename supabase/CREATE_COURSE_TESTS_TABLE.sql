-- ============================================
-- TABLE POUR LIER LES TESTS AUX FORMATIONS AVEC POSITIONNEMENT
-- ============================================

-- Table pour lier les tests aux formations avec positionnement
CREATE TABLE IF NOT EXISTS public.course_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  -- Positionnement dans la formation
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  subchapter_id uuid REFERENCES public.subchapters(id) ON DELETE SET NULL,
  -- Position relative (après quel élément)
  position_after_id uuid, -- ID de la section/chapitre/sous-chapitre après lequel placer le test
  position_type text CHECK (position_type IN ('after_section', 'after_chapter', 'after_subchapter')),
  order_index integer NOT NULL DEFAULT 0,
  -- Métadonnées
  required boolean NOT NULL DEFAULT false,
  unlock_condition text, -- Condition pour débloquer le test (ex: "complete_section_1")
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, test_id)
);

CREATE INDEX IF NOT EXISTS course_tests_course_idx ON public.course_tests (course_id);
CREATE INDEX IF NOT EXISTS course_tests_test_idx ON public.course_tests (test_id);
CREATE INDEX IF NOT EXISTS course_tests_section_idx ON public.course_tests (section_id);
CREATE INDEX IF NOT EXISTS course_tests_chapter_idx ON public.course_tests (chapter_id);
CREATE INDEX IF NOT EXISTS course_tests_order_idx ON public.course_tests (course_id, order_index);

-- ============================================
-- TABLE POUR LES MESSAGES PERSONNALISÉS SELON LES RÉSULTATS
-- ============================================

CREATE TABLE IF NOT EXISTS public.test_result_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  -- Conditions de déclenchement
  min_score numeric(5,2), -- Score minimum (ex: 0.0 pour 0%)
  max_score numeric(5,2), -- Score maximum (ex: 50.0 pour 50%)
  -- Message personnalisé
  title text NOT NULL,
  message text NOT NULL,
  -- Aide IA générée
  ai_generated boolean NOT NULL DEFAULT false,
  ai_prompt text, -- Prompt utilisé pour générer le message
  -- Ordre d'affichage (pour plusieurs messages)
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_result_messages_test_idx ON public.test_result_messages (test_id);
CREATE INDEX IF NOT EXISTS test_result_messages_score_idx ON public.test_result_messages (test_id, min_score, max_score);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.course_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_result_messages ENABLE ROW LEVEL SECURITY;

-- RLS pour course_tests
CREATE POLICY course_tests_select_owner ON public.course_tests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_tests.course_id
        AND (c.creator_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY course_tests_insert_owner ON public.course_tests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_tests.course_id
        AND (c.creator_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY course_tests_update_owner ON public.course_tests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_tests.course_id
        AND (c.creator_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY course_tests_delete_owner ON public.course_tests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_tests.course_id
        AND (c.creator_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

-- RLS pour test_result_messages
CREATE POLICY test_result_messages_select_owner ON public.test_result_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_result_messages.test_id
        AND (t.created_by = auth.uid() OR t.owner_id = auth.uid())
    )
  );

CREATE POLICY test_result_messages_insert_owner ON public.test_result_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_result_messages.test_id
        AND (t.created_by = auth.uid() OR t.owner_id = auth.uid())
    )
  );

CREATE POLICY test_result_messages_update_owner ON public.test_result_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_result_messages.test_id
        AND (t.created_by = auth.uid() OR t.owner_id = auth.uid())
    )
  );

CREATE POLICY test_result_messages_delete_owner ON public.test_result_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_result_messages.test_id
        AND (t.created_by = auth.uid() OR t.owner_id = auth.uid())
    )
  );



