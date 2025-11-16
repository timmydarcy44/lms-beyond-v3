-- Ajouter la colonne display_format à la table tests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' AND column_name = 'display_format'
    ) THEN
        ALTER TABLE public.tests 
        ADD COLUMN display_format TEXT DEFAULT 'score' 
        CHECK (display_format IN ('ranking', 'radar', 'score', 'detailed'));
        
        RAISE NOTICE 'Colonne "display_format" ajoutée à la table "tests".';
    ELSE
        RAISE NOTICE 'Colonne "display_format" existe déjà dans la table "tests".';
    END IF;
END $$;

-- Créer la table test_attempts si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    total_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    category_results JSONB DEFAULT '[]'::jsonb, -- Résultats par catégorie
    answers JSONB DEFAULT '{}'::jsonb, -- Réponses données (question_id -> answer)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT test_attempts_test_user_unique UNIQUE (test_id, user_id, completed_at)
);

-- Créer un index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON public.test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed_at ON public.test_attempts(completed_at DESC);

-- RLS pour test_attempts
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres tentatives
DROP POLICY IF EXISTS test_attempts_select_own ON public.test_attempts;
CREATE POLICY test_attempts_select_own ON public.test_attempts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres tentatives
DROP POLICY IF EXISTS test_attempts_insert_own ON public.test_attempts;
CREATE POLICY test_attempts_insert_own ON public.test_attempts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les formateurs/admins peuvent voir les tentatives des apprenants de leur organisation
DROP POLICY IF EXISTS test_attempts_select_instructors ON public.test_attempts;
CREATE POLICY test_attempts_select_instructors ON public.test_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_memberships om1
            WHERE om1.user_id = auth.uid()
            AND om1.role IN ('instructor', 'admin', 'tutor')
            AND EXISTS (
                SELECT 1 FROM public.org_memberships om2
                WHERE om2.user_id = test_attempts.user_id
                AND om2.org_id = om1.org_id
            )
        )
    );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_test_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS test_attempts_updated_at ON public.test_attempts;
CREATE TRIGGER test_attempts_updated_at
    BEFORE UPDATE ON public.test_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_test_attempts_updated_at();

