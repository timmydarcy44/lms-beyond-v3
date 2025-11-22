-- Migration pour permettre les réservations sans authentification
-- Permettre learner_id NULL dans la table appointments

-- 1. Modifier la colonne learner_id pour permettre NULL
ALTER TABLE public.appointments 
  ALTER COLUMN learner_id DROP NOT NULL;

-- 2. Supprimer toutes les politiques existantes pour appointments (on va les recréer)
DROP POLICY IF EXISTS "Super admin can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Learners can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Learners can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Learners can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- 3. Recréer les politiques RLS avec support pour les réservations anonymes

-- Politique pour le super admin : peut voir tous ses rendez-vous (y compris anonymes)
CREATE POLICY "Super admin can view all appointments"
  ON public.appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = appointments.super_admin_id
      AND profiles.id = auth.uid()
    )
  );

-- Politique pour le super admin : peut créer des rendez-vous
CREATE POLICY "Super admin can create appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = appointments.super_admin_id
      AND profiles.id = auth.uid()
    )
  );

-- Politique pour le super admin : peut mettre à jour ses rendez-vous
CREATE POLICY "Super admin can update appointments"
  ON public.appointments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = appointments.super_admin_id
      AND profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = appointments.super_admin_id
      AND profiles.id = auth.uid()
    )
  );

-- Politique pour le super admin : peut supprimer ses rendez-vous
CREATE POLICY "Super admin can delete appointments"
  ON public.appointments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = appointments.super_admin_id
      AND profiles.id = auth.uid()
    )
  );

-- Politique pour les apprenants : peuvent voir leurs propres rendez-vous
CREATE POLICY "Learners can view own appointments"
  ON public.appointments
  FOR SELECT
  USING (
    learner_id IS NOT NULL 
    AND auth.uid() = learner_id
  );

-- Politique pour les apprenants : peuvent créer leurs propres rendez-vous
CREATE POLICY "Learners can create own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (
    learner_id IS NOT NULL 
    AND auth.uid() = learner_id
  );

-- Politique pour les apprenants : peuvent mettre à jour leurs propres rendez-vous
CREATE POLICY "Learners can update own appointments"
  ON public.appointments
  FOR UPDATE
  USING (
    learner_id IS NOT NULL 
    AND auth.uid() = learner_id
  )
  WITH CHECK (
    learner_id IS NOT NULL 
    AND auth.uid() = learner_id
  );

-- Politique pour les réservations anonymes : permet la création sans authentification
-- (seulement si learner_id IS NULL et super_admin_id est valide)
-- Cette politique permet l'insertion même si auth.uid() est NULL
CREATE POLICY "Anyone can create anonymous appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (
    learner_id IS NULL
    AND super_admin_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = appointments.super_admin_id
    )
  );

-- 4. Politique pour permettre la lecture des rendez-vous anonymes par le super admin
-- (déjà couverte par "Super admin can manage all appointments" mais on la rend explicite)
-- Cette politique est déjà couverte par la politique du super admin ci-dessus

-- 5. Ajouter un index pour les rendez-vous sans learner_id (optionnel, pour performance)
CREATE INDEX IF NOT EXISTS appointments_learner_id_null_idx 
  ON public.appointments (super_admin_id) 
  WHERE learner_id IS NULL;

