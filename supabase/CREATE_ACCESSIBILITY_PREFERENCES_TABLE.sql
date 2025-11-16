-- Table pour stocker les préférences d'accessibilité des utilisateurs
-- Notamment pour le mode dyslexie

CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Préférences dyslexie
  dyslexia_mode_enabled BOOLEAN DEFAULT false,
  letter_spacing DECIMAL(4, 2) DEFAULT 0.15, -- en em
  line_height DECIMAL(4, 2) DEFAULT 2.0,
  word_spacing DECIMAL(4, 2) DEFAULT 0.3, -- en em
  font_family TEXT DEFAULT 'OpenDyslexic', -- OpenDyslexic, Arial, Comic Sans, etc.
  contrast_level TEXT DEFAULT 'normal', -- normal, high, very-high
  highlight_confusing_letters BOOLEAN DEFAULT true, -- b, d, p, q, m, n, u
  underline_complex_sounds BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un seul enregistrement par utilisateur
  UNIQUE(user_id)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_user_accessibility_preferences_user_id 
  ON user_accessibility_preferences(user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_accessibility_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_accessibility_preferences_updated_at 
  ON user_accessibility_preferences;

CREATE TRIGGER trigger_update_user_accessibility_preferences_updated_at
  BEFORE UPDATE ON user_accessibility_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_accessibility_preferences_updated_at();

-- RLS Policies
ALTER TABLE user_accessibility_preferences ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et modifier leurs propres préférences
DROP POLICY IF EXISTS "Users can view their own accessibility preferences" 
  ON user_accessibility_preferences;

CREATE POLICY "Users can view their own accessibility preferences"
  ON user_accessibility_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own accessibility preferences" 
  ON user_accessibility_preferences;

CREATE POLICY "Users can insert their own accessibility preferences"
  ON user_accessibility_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accessibility preferences" 
  ON user_accessibility_preferences;

CREATE POLICY "Users can update their own accessibility preferences"
  ON user_accessibility_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE user_accessibility_preferences IS 'Stocke les préférences d''accessibilité des utilisateurs, notamment pour le mode dyslexie';
COMMENT ON COLUMN user_accessibility_preferences.letter_spacing IS 'Espacement entre les lettres en em (ex: 0.15em)';
COMMENT ON COLUMN user_accessibility_preferences.line_height IS 'Hauteur de ligne (ex: 2.0 pour double interligne)';
COMMENT ON COLUMN user_accessibility_preferences.word_spacing IS 'Espacement entre les mots en em (ex: 0.3em)';
COMMENT ON COLUMN user_accessibility_preferences.font_family IS 'Police de caractères choisie (OpenDyslexic, Arial, Comic Sans, etc.)';
COMMENT ON COLUMN user_accessibility_preferences.contrast_level IS 'Niveau de contraste: normal, high, very-high';
COMMENT ON COLUMN user_accessibility_preferences.highlight_confusing_letters IS 'Mettre en évidence les lettres confusantes (b, d, p, q, m, n, u)';
COMMENT ON COLUMN user_accessibility_preferences.underline_complex_sounds IS 'Souligner les sons complexes';

