-- Table pour stocker les métadonnées des vidéos de gamification
-- Les vidéos elles-mêmes sont stockées dans Supabase Storage

CREATE TABLE IF NOT EXISTS gamification_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  title TEXT NOT NULL,
  description TEXT,
  video_type TEXT NOT NULL CHECK (video_type IN ('journalist', 'player', 'background', 'other')),
  
  -- Référence au fichier dans Storage
  storage_path TEXT NOT NULL, -- Chemin dans le bucket (ex: "journalist/interview-1.mp4")
  storage_bucket TEXT NOT NULL DEFAULT 'gamification-videos',
  public_url TEXT, -- URL publique si le bucket est public
  
  -- Métadonnées vidéo
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  mime_type TEXT DEFAULT 'video/mp4',
  resolution_width INTEGER,
  resolution_height INTEGER,
  
  -- Tags et catégories
  tags TEXT[],
  scenario_context TEXT, -- Contexte d'utilisation (ex: "media-training-psg")
  
  -- Métadonnées système
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_gamification_videos_type ON gamification_videos(video_type);
CREATE INDEX IF NOT EXISTS idx_gamification_videos_active ON gamification_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_gamification_videos_created_by ON gamification_videos(created_by);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_gamification_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gamification_videos_updated_at ON gamification_videos;

CREATE TRIGGER trigger_update_gamification_videos_updated_at
  BEFORE UPDATE ON gamification_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification_videos_updated_at();

-- RLS Policies
ALTER TABLE gamification_videos ENABLE ROW LEVEL SECURITY;

-- Super admins peuvent tout faire
DROP POLICY IF EXISTS "Super admins can manage gamification videos" ON gamification_videos;

CREATE POLICY "Super admins can manage gamification videos"
  ON gamification_videos
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

-- Tous peuvent voir les vidéos actives (pour l'affichage)
DROP POLICY IF EXISTS "Anyone can view active gamification videos" ON gamification_videos;

CREATE POLICY "Anyone can view active gamification videos"
  ON gamification_videos
  FOR SELECT
  TO public
  USING (is_active = true);

-- Commentaires
COMMENT ON TABLE gamification_videos IS 'Métadonnées des vidéos utilisées dans la gamification/media training';
COMMENT ON COLUMN gamification_videos.video_type IS 'Type de vidéo: journalist (journaliste), player (joueur), background (fond), other';
COMMENT ON COLUMN gamification_videos.storage_path IS 'Chemin du fichier dans Supabase Storage';
COMMENT ON COLUMN gamification_videos.scenario_context IS 'Contexte d''utilisation (ex: media-training-psg, interview-scenario-1)';




