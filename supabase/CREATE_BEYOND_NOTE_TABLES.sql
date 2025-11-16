-- Table pour stocker les documents Beyond Note
CREATE TABLE IF NOT EXISTS public.beyond_note_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_beyond_note_documents_user_id ON public.beyond_note_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_beyond_note_documents_created_at ON public.beyond_note_documents(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.beyond_note_documents ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne peuvent voir que leurs propres documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.beyond_note_documents;
CREATE POLICY "Users can view their own documents"
  ON public.beyond_note_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent créer leurs propres documents
DROP POLICY IF EXISTS "Users can create their own documents" ON public.beyond_note_documents;
CREATE POLICY "Users can create their own documents"
  ON public.beyond_note_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres documents
DROP POLICY IF EXISTS "Users can update their own documents" ON public.beyond_note_documents;
CREATE POLICY "Users can update their own documents"
  ON public.beyond_note_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres documents
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.beyond_note_documents;
CREATE POLICY "Users can delete their own documents"
  ON public.beyond_note_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Table pour stocker les résultats des actions IA
CREATE TABLE IF NOT EXISTS public.beyond_note_ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.beyond_note_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('revision-sheet', 'reformulate', 'translate', 'diagram', 'cleanup', 'audio')),
  result_text TEXT,
  result_url TEXT, -- Pour les fichiers audio ou images générés
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_beyond_note_ai_results_document_id ON public.beyond_note_ai_results(document_id);
CREATE INDEX IF NOT EXISTS idx_beyond_note_ai_results_user_id ON public.beyond_note_ai_results(user_id);

-- RLS pour les résultats IA
ALTER TABLE public.beyond_note_ai_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI results" ON public.beyond_note_ai_results;
CREATE POLICY "Users can view their own AI results"
  ON public.beyond_note_ai_results
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own AI results" ON public.beyond_note_ai_results;
CREATE POLICY "Users can create their own AI results"
  ON public.beyond_note_ai_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_beyond_note_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_beyond_note_documents_updated_at ON public.beyond_note_documents;
CREATE TRIGGER update_beyond_note_documents_updated_at
  BEFORE UPDATE ON public.beyond_note_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_beyond_note_documents_updated_at();

-- Créer le bucket Supabase Storage pour Beyond Note (à faire manuellement dans le dashboard Supabase)
-- Nom du bucket : "beyond-note"
-- Public : false (privé)
-- File size limit : selon vos besoins
-- Allowed MIME types : image/*, application/pdf

