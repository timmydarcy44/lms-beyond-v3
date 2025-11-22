-- Table pour stocker les comptes Stripe Connect des Super Admins

DO $$
BEGIN
    -- Créer la table stripe_connect_accounts si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_connect_accounts') THEN
        CREATE TABLE public.stripe_connect_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            stripe_account_id TEXT NOT NULL UNIQUE,
            account_type TEXT NOT NULL DEFAULT 'express', -- 'express', 'standard', 'custom'
            charges_enabled BOOLEAN DEFAULT false,
            payouts_enabled BOOLEAN DEFAULT false,
            details_submitted BOOLEAN DEFAULT false,
            email TEXT,
            country TEXT,
            default_currency TEXT DEFAULT 'eur',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );

        -- Créer un index sur user_id pour des recherches rapides
        CREATE INDEX idx_stripe_connect_accounts_user_id ON public.stripe_connect_accounts(user_id);
        
        -- Créer un index sur stripe_account_id
        CREATE INDEX idx_stripe_connect_accounts_stripe_account_id ON public.stripe_connect_accounts(stripe_account_id);

        -- RLS : Les utilisateurs peuvent voir uniquement leur propre compte Stripe
        ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own Stripe account"
            ON public.stripe_connect_accounts
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own Stripe account"
            ON public.stripe_connect_accounts
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own Stripe account"
            ON public.stripe_connect_accounts
            FOR UPDATE
            USING (auth.uid() = user_id);

        -- Super Admins peuvent voir tous les comptes
        CREATE POLICY "Super admins can view all Stripe accounts"
            ON public.stripe_connect_accounts
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.super_admins
                    WHERE super_admins.user_id = auth.uid()
                    AND super_admins.is_active = true
                )
            );

        RAISE NOTICE 'Table "stripe_connect_accounts" créée avec succès.';
    ELSE
        RAISE NOTICE 'Table "stripe_connect_accounts" existe déjà.';
    END IF;
END $$;








