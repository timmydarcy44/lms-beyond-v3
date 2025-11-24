-- Table pour gérer les abonnements Stripe par tenant
-- ====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL, -- 'beyond-noschool', 'beyond-care', 'beyond-note'
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  plan TEXT NOT NULL, -- 'monthly', 'yearly'
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'canceled', 'past_due', 'inactive', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_tenant_id CHECK (tenant_id IN ('beyond-noschool', 'beyond-care', 'beyond-note')),
  CONSTRAINT valid_plan CHECK (plan IN ('monthly', 'yearly')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'inactive', 'trialing', 'unpaid'))
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_tenant ON public.subscriptions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON public.subscriptions(tenant_id, status);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres abonnements
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres abonnements
CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres abonnements
CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les Super Admins peuvent voir tous les abonnements de leur tenant
CREATE POLICY "Super admins can view all subscriptions for their tenant"
  ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.super_admins sa
      JOIN public.profiles p ON sa.user_id = p.id
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
        AND p.email IN (
          SELECT super_admin_email
          FROM (VALUES 
            ('beyond-noschool', 'timdarcypro@gmail.com'),
            ('beyond-care', 'contentin.cabinet@gmail.com'),
            ('beyond-note', 'timdarcypro@gmail.com')
          ) AS tenants(tenant_id, super_admin_email)
          WHERE tenant_id = subscriptions.tenant_id
        )
    )
  );

-- Fonction pour vérifier si un utilisateur a un abonnement actif
CREATE OR REPLACE FUNCTION has_active_subscription(
  p_user_id UUID,
  p_tenant_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.subscriptions IS 'Gère les abonnements Stripe par tenant (Beyond No School, Beyond Care, Beyond Note)';
COMMENT ON COLUMN public.subscriptions.tenant_id IS 'Identifiant du tenant: beyond-noschool, beyond-care, ou beyond-note';
COMMENT ON COLUMN public.subscriptions.plan IS 'Type d''abonnement: monthly ou yearly';
COMMENT ON COLUMN public.subscriptions.status IS 'Statut de l''abonnement Stripe: active, canceled, past_due, inactive, trialing, unpaid';




