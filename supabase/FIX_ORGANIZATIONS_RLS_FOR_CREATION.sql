-- Corriger les politiques RLS pour permettre la création d'organisations
-- Vérifier d'abord si RLS est activé
DO $$
BEGIN
    -- Activer RLS si ce n'est pas déjà fait
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé pour la table organizations';
    ELSE
        RAISE NOTICE 'RLS déjà activé pour la table organizations';
    END IF;
END $$;

-- Supprimer les anciennes politiques INSERT si elles existent
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
DROP POLICY IF EXISTS organizations_insert_all ON public.organizations;
DROP POLICY IF EXISTS organizations_insert_super_admin ON public.organizations;

-- Créer une politique INSERT pour permettre aux utilisateurs authentifiés de créer des organisations
-- Cette politique permet à n'importe quel utilisateur authentifié de créer une organisation
-- Note: Si d'autres politiques INSERT existent déjà, elles seront supprimées ci-dessus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
        AND policyname = 'organizations_insert'
    ) THEN
        CREATE POLICY organizations_insert ON public.organizations
            FOR INSERT
            TO authenticated
            WITH CHECK (true);
        
        RAISE NOTICE 'Politique INSERT organizations_insert créée avec succès';
    ELSE
        RAISE NOTICE 'Politique INSERT organizations_insert existe déjà';
    END IF;
END $$;

-- Note: Les politiques SELECT et UPDATE existantes sont conservées
-- Seule la politique INSERT est ajoutée/modifiée pour permettre la création d'organisations

-- Vérifier que les politiques ont été créées
DO $$
DECLARE
    policy_count INTEGER;
    insert_policy_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'organizations';
    
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
        AND policyname = 'organizations_insert'
    ) INTO insert_policy_exists;
    
    RAISE NOTICE 'Nombre total de politiques RLS pour organizations: %', policy_count;
    
    IF insert_policy_exists THEN
        RAISE NOTICE '✓ Politique INSERT organizations_insert créée avec succès';
    ELSE
        RAISE WARNING '✗ Politique INSERT organizations_insert non trouvée';
    END IF;
END $$;

