-- ============================================
-- Tables pour le système d'agenda type Doctolib
-- ============================================

-- Table des plages horaires disponibles
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  is_available boolean NOT NULL DEFAULT true,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_pattern text, -- 'daily', 'weekly', 'monthly'
  recurring_end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0)
);

CREATE INDEX IF NOT EXISTS appointment_slots_super_admin_id_idx ON public.appointment_slots (super_admin_id);
CREATE INDEX IF NOT EXISTS appointment_slots_start_time_idx ON public.appointment_slots (start_time);
CREATE INDEX IF NOT EXISTS appointment_slots_is_available_idx ON public.appointment_slots (is_available);

-- Table des rendez-vous
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES public.appointment_slots(id) ON DELETE SET NULL,
  super_admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  subject text,
  notes text,
  learner_notes text, -- Notes de l'apprenant lors de la prise de RDV
  email_sent boolean NOT NULL DEFAULT false,
  sms_sent boolean NOT NULL DEFAULT false,
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles(id),
  CONSTRAINT valid_appointment_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS appointments_super_admin_id_idx ON public.appointments (super_admin_id);
CREATE INDEX IF NOT EXISTS appointments_learner_id_idx ON public.appointments (learner_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON public.appointments (start_time);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments (status);
CREATE INDEX IF NOT EXISTS appointments_slot_id_idx ON public.appointments (slot_id);

-- Table pour les notifications de rendez-vous
CREATE TABLE IF NOT EXISTS public.appointment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('confirmation', 'reminder', 'cancellation')),
  sent_via text NOT NULL CHECK (sent_via IN ('email', 'sms', 'both')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipient_email text,
  recipient_phone text,
  message_content text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

CREATE INDEX IF NOT EXISTS appointment_notifications_appointment_id_idx ON public.appointment_notifications (appointment_id);
CREATE INDEX IF NOT EXISTS appointment_notifications_sent_at_idx ON public.appointment_notifications (sent_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointment_slots_updated_at BEFORE UPDATE ON public.appointment_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notifications ENABLE ROW LEVEL SECURITY;

-- Policy pour appointment_slots : le super admin peut tout faire, les apprenants peuvent voir les créneaux disponibles
CREATE POLICY "Super admin can manage own slots"
  ON public.appointment_slots
  FOR ALL
  USING (auth.uid() = super_admin_id);

CREATE POLICY "Learners can view available slots"
  ON public.appointment_slots
  FOR SELECT
  USING (is_available = true AND start_time > now());

-- Policy pour appointments : le super admin peut tout faire, les apprenants peuvent voir et créer leurs propres rendez-vous
CREATE POLICY "Super admin can manage all appointments"
  ON public.appointments
  FOR ALL
  USING (auth.uid() = super_admin_id);

CREATE POLICY "Learners can view own appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid() = learner_id);

CREATE POLICY "Learners can create own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Learners can update own appointments"
  ON public.appointments
  FOR UPDATE
  USING (auth.uid() = learner_id)
  WITH CHECK (auth.uid() = learner_id);

-- Policy pour appointment_notifications : lecture seule pour les apprenants, tout pour le super admin
CREATE POLICY "Super admin can manage notifications"
  ON public.appointment_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = appointment_notifications.appointment_id
      AND appointments.super_admin_id = auth.uid()
    )
  );

CREATE POLICY "Learners can view own notifications"
  ON public.appointment_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = appointment_notifications.appointment_id
      AND appointments.learner_id = auth.uid()
    )
  );

