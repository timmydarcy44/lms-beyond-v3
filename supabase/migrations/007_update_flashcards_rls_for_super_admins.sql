-- 007_update_flashcards_rls_for_super_admins.sql
-- Mise à jour de la politique RLS flashcards_write pour inclure les super admins
-- À exécuter après 003_fix_inconsistencies.sql

BEGIN;

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS flashcards_write ON public.flashcards;

-- Recréer la politique avec support des super admins
DO $$
BEGIN
  -- Vérifier si creator_id existe dans courses avant de créer la policy
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'creator_id'
  ) THEN
    -- Vérifier si la table super_admins existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'super_admins'
    ) THEN
      -- Créer la politique avec support des super admins
      CREATE POLICY flashcards_write ON public.flashcards
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = flashcards.course_id
              AND (
                c.creator_id = auth.uid()
                OR public.user_has_role(auth.uid(), array['admin','instructor'])
                OR EXISTS (
                  SELECT 1 FROM public.super_admins sa
                  WHERE sa.user_id = auth.uid() AND sa.is_active = true
                )
              )
          )
        ) WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = flashcards.course_id
              AND (
                c.creator_id = auth.uid()
                OR public.user_has_role(auth.uid(), array['admin','instructor'])
                OR EXISTS (
                  SELECT 1 FROM public.super_admins sa
                  WHERE sa.user_id = auth.uid() AND sa.is_active = true
                )
              )
          )
        );
    ELSE
      -- Créer la politique sans support des super admins (fallback)
      CREATE POLICY flashcards_write ON public.flashcards
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = flashcards.course_id
              AND (
                c.creator_id = auth.uid()
                OR public.user_has_role(auth.uid(), array['admin','instructor'])
              )
          )
        ) WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = flashcards.course_id
              AND (
                c.creator_id = auth.uid()
                OR public.user_has_role(auth.uid(), array['admin','instructor'])
              )
          )
        );
    END IF;
  ELSE
    -- Fallback si creator_id n'existe pas : juste vérifier le rôle et les super admins
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'super_admins'
    ) THEN
      CREATE POLICY flashcards_write ON public.flashcards
        FOR ALL USING (
          public.user_has_role(auth.uid(), array['admin','instructor'])
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = true
          )
        ) WITH CHECK (
          public.user_has_role(auth.uid(), array['admin','instructor'])
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = true
          )
        );
    ELSE
      -- Fallback si super_admins n'existe pas
      CREATE POLICY flashcards_write ON public.flashcards
        FOR ALL USING (
          public.user_has_role(auth.uid(), array['admin','instructor'])
        ) WITH CHECK (
          public.user_has_role(auth.uid(), array['admin','instructor'])
        );
    END IF;
  END IF;
END $$;

COMMIT;

