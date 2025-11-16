-- Table pour stocker les tâches To-Do / Kanban

CREATE TABLE IF NOT EXISTS todo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de base
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
  
  -- Contexte pédagogique
  task_type TEXT NOT NULL CHECK (task_type IN (
    -- Apprenant
    'homework', 'review', 'project', 'exam', 'reading', 'exercise',
    -- Formateur
    'content_creation', 'content_review', 'course_planning', 'grading',
    -- Tuteur
    'student_followup', 'correction', 'tutoring_session', 'feedback',
    -- Admin
    'organization_management', 'user_assignment', 'content_assignment', 'reporting'
  )),
  role_filter TEXT NOT NULL CHECK (role_filter IN ('learner', 'instructor', 'tutor', 'admin')),
  
  -- Liens vers contenu
  linked_content_type TEXT CHECK (linked_content_type IN ('course', 'path', 'resource', 'test', 'lesson')),
  linked_content_id UUID,
  
  -- Assignation
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_group_id UUID, -- Peut référencer une table groups si elle existe
  
  -- Métadonnées
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  tags TEXT[], -- Array de tags
  
  -- Sous-tâches (stockées en JSONB)
  subtasks JSONB DEFAULT '[]'::jsonb,
  
  -- Pièces jointes (stockées en JSONB: [{type: 'file'|'link', url: string, name: string}])
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Commentaires (stockés en JSONB: [{user_id, comment, created_at}])
  comments JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées système
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Colonne pour le Kanban (position dans la colonne)
  kanban_position INTEGER DEFAULT 0
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_id ON todo_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_status ON todo_tasks(status);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_role_filter ON todo_tasks(role_filter);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_due_date ON todo_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_assigned_to ON todo_tasks(assigned_to_user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_todo_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_todo_tasks_updated_at ON todo_tasks;

CREATE TRIGGER trigger_update_todo_tasks_updated_at
  BEFORE UPDATE ON todo_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_todo_tasks_updated_at();

-- RLS Policies
ALTER TABLE todo_tasks ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres tâches et celles qui leur sont assignées
DROP POLICY IF EXISTS "Users can view their own tasks" ON todo_tasks;

CREATE POLICY "Users can view their own tasks"
  ON todo_tasks
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to_user_id
  );

-- Les utilisateurs peuvent créer leurs propres tâches
DROP POLICY IF EXISTS "Users can create their own tasks" ON todo_tasks;

CREATE POLICY "Users can create their own tasks"
  ON todo_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres tâches et celles qui leur sont assignées
DROP POLICY IF EXISTS "Users can update their own tasks" ON todo_tasks;

CREATE POLICY "Users can update their own tasks"
  ON todo_tasks
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to_user_id
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to_user_id
  );

-- Les utilisateurs peuvent supprimer leurs propres tâches
DROP POLICY IF EXISTS "Users can delete their own tasks" ON todo_tasks;

CREATE POLICY "Users can delete their own tasks"
  ON todo_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE todo_tasks IS 'Tâches To-Do / Kanban pour tous les rôles';
COMMENT ON COLUMN todo_tasks.role_filter IS 'Filtre par rôle pour afficher les types de tâches appropriés';
COMMENT ON COLUMN todo_tasks.task_type IS 'Type de tâche spécifique au rôle';
COMMENT ON COLUMN todo_tasks.subtasks IS 'Liste de sous-tâches en JSON: [{id, title, completed}]';
COMMENT ON COLUMN todo_tasks.attachments IS 'Pièces jointes en JSON: [{type, url, name}]';
COMMENT ON COLUMN todo_tasks.comments IS 'Commentaires en JSON: [{user_id, comment, created_at}]';
