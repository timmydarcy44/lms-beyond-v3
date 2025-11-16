-- Créer la table pour stocker les analyses de résultats de tests
CREATE TABLE IF NOT EXISTS public.test_result_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_results JSONB DEFAULT '[]'::jsonb, -- Résultats par catégorie utilisés pour l'analyse
    analysis TEXT NOT NULL, -- Analyse générée par l'IA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT test_result_analyses_attempt_unique UNIQUE (attempt_id)
);

-- Créer un index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_test_result_analyses_user_id ON public.test_result_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_test_result_analyses_test_id ON public.test_result_analyses(test_id);
CREATE INDEX IF NOT EXISTS idx_test_result_analyses_attempt_id ON public.test_result_analyses(attempt_id);

-- RLS pour test_result_analyses
ALTER TABLE public.test_result_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres analyses
DROP POLICY IF EXISTS test_result_analyses_select_own ON public.test_result_analyses;
CREATE POLICY test_result_analyses_select_own ON public.test_result_analyses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres analyses (via l'API)
DROP POLICY IF EXISTS test_result_analyses_insert_own ON public.test_result_analyses;
CREATE POLICY test_result_analyses_insert_own ON public.test_result_analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les Super Admins peuvent voir toutes les analyses
DROP POLICY IF EXISTS test_result_analyses_select_super_admin ON public.test_result_analyses;
CREATE POLICY test_result_analyses_select_super_admin ON public.test_result_analyses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.super_admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Policy: Les formateurs/admins peuvent voir les analyses de leurs apprenants
DROP POLICY IF EXISTS test_result_analyses_select_instructors ON public.test_result_analyses;
CREATE POLICY test_result_analyses_select_instructors ON public.test_result_analyses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_memberships om1
            WHERE om1.user_id = auth.uid()
            AND om1.role IN ('instructor', 'admin', 'tutor')
            AND EXISTS (
                SELECT 1 FROM public.org_memberships om2
                WHERE om2.user_id = test_result_analyses.user_id
                AND om2.org_id = om1.org_id
            )
        )
    );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_test_result_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS test_result_analyses_updated_at ON public.test_result_analyses;
CREATE TRIGGER test_result_analyses_updated_at
    BEFORE UPDATE ON public.test_result_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_test_result_analyses_updated_at();




