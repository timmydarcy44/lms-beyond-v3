-- ============================================================================
-- Tables pour la gestion des prompts IA et l'historique des interactions
-- ============================================================================

-- Table pour stocker les prompts personnalisés
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  prompt_location TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Table pour l'historique des interactions IA
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  feature_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  prompt_variables JSONB,
  response JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  tokens_used INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_feature_id ON ai_interactions(feature_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_ai_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_ai_prompts_updated_at ON ai_prompts;
CREATE TRIGGER trigger_update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_prompts_updated_at();

-- RLS (Row Level Security)
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Super admins can manage ai_prompts" ON ai_prompts;
DROP POLICY IF EXISTS "Users can view their own ai_interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can insert their own ai_interactions" ON ai_interactions;

-- Politique pour ai_prompts : Seuls les super admins peuvent lire/écrire
CREATE POLICY "Super admins can manage ai_prompts"
  ON ai_prompts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
      AND super_admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
      AND super_admins.is_active = true
    )
  );

-- Politique pour ai_interactions : Les utilisateurs peuvent voir leurs propres interactions
-- Les super admins peuvent voir toutes les interactions
CREATE POLICY "Users can view their own ai_interactions"
  ON ai_interactions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
      AND super_admins.is_active = true
    )
  );

-- Les utilisateurs peuvent insérer leurs propres interactions
-- Les super admins peuvent insérer n'importe quelle interaction (via service role)
CREATE POLICY "Users can insert their own ai_interactions"
  ON ai_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
      AND super_admins.is_active = true
    )
  );

-- Insérer les prompts par défaut
INSERT INTO ai_prompts (feature_id, feature_name, prompt_location, prompt_template, endpoint, description)
VALUES
  (
    'generate-course-structure',
    'Génération de structure de cours',
    'src/app/api/ai/generate-course-structure/route.ts',
    'Génère la structure complète d''une formation avec sections, chapitres et sous-chapitres.

{context}

Instructions spécifiques : {userPrompt}

La structure doit être :
- Logique et progressive
- Complète avec sections, chapitres et sous-chapitres
- Adaptée au public cible
- Pédagogiquement cohérente
- Avec des durées estimées réalistes',
    '/api/ai/generate-course-structure',
    'Génère la structure complète d''une formation avec sections, chapitres et sous-chapitres'
  ),
  (
    'create-chapter',
    'Création de chapitre',
    'src/lib/ai/prompts/chapter-generation.ts',
    'Tu es un expert en pédagogie et en création de contenu de formation.

{contextSection}

L''utilisateur souhaite créer un chapitre avec le prompt suivant :
"{userPrompt}"

Génère un chapitre de formation complet et structuré au format JSON suivant :
{
  "title": "Titre du chapitre (accrocheur et clair)",
  "summary": "Résumé pédagogique en 2-3 phrases expliquant l''objectif et le livrable",
  "content": "Contenu détaillé du chapitre en markdown. Inclut des sections structurées, des points clés, des exemples concrets, et des call-to-action pédagogiques.",
  "duration": "Durée estimée (ex: ''45 min'', ''1h30'')",
  "type": "video" | "text" | "document",
  "suggestedSubchapters": [...]
}

Le contenu doit être :
- Pédagogique et actionnable
- Structuré avec des sections claires (utilise ## pour les titres de sections)
- Enrichi d''exemples concrets et de cas pratiques
- Adapté au contexte de la formation mentionné
- Rédigé en français

Réponds uniquement avec le JSON, sans texte additionnel.',
    '/api/ai/create-chapter',
    'Génère un chapitre complet avec contenu, résumé et sous-chapitres suggérés'
  ),
  (
    'generate-flashcards',
    'Génération de flashcards',
    'src/lib/ai/prompts/chapter-generation.ts',
    'Tu es un expert en pédagogie et en création de flashcards éducatives.

À partir du contenu suivant du chapitre "{chapterTitle}" :

{chapterContent}

Génère 5 à 8 flashcards au format JSON suivant :
{
  "flashcards": [
    {
      "question": "Question claire et précise",
      "answer": "Réponse détaillée et pédagogique",
      "tags": ["tag1", "tag2"],
      "difficulty": "facile" | "intermédiaire" | "expert"
    }
  ]
}

Les flashcards doivent :
- Couvrir les concepts clés du chapitre
- Être progressives (de facile à expert)
- Utiliser des questions ouvertes qui favorisent la réflexion
- Avoir des réponses complètes mais concises
- Être adaptées à la révision active

Réponds uniquement avec le JSON, sans texte additionnel.',
    '/api/ai/generate-flashcards',
    'Génère des flashcards à partir du contenu d''un chapitre'
  )
ON CONFLICT (feature_id) DO NOTHING;

-- Commentaires
COMMENT ON TABLE ai_prompts IS 'Stocke les prompts personnalisés pour chaque fonctionnalité IA';
COMMENT ON TABLE ai_interactions IS 'Historique de toutes les interactions avec l''IA sur la plateforme';

