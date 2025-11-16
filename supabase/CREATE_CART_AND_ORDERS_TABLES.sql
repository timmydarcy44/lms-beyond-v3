-- Tables pour le système de panier et commandes

DO $$
BEGIN
    -- Table cart_items : panier utilisateur
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items') THEN
        CREATE TABLE public.cart_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            content_id UUID NOT NULL,
            content_type TEXT NOT NULL CHECK (content_type IN ('module', 'test', 'ressource', 'parcours')),
            title TEXT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            thumbnail_url TEXT,
            added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, content_id, content_type)
        );

        CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
        CREATE INDEX idx_cart_items_content ON public.cart_items(content_id, content_type);

        -- RLS
        ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own cart items"
            ON public.cart_items FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own cart items"
            ON public.cart_items FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own cart items"
            ON public.cart_items FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own cart items"
            ON public.cart_items FOR DELETE
            USING (auth.uid() = user_id);

        RAISE NOTICE 'Table "cart_items" créée avec succès.';
    ELSE
        RAISE NOTICE 'Table "cart_items" existe déjà.';
    END IF;

    -- Table orders : commandes finalisées
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        CREATE TABLE public.orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            stripe_session_id TEXT,
            stripe_payment_intent_id TEXT,
            total_amount DECIMAL(10, 2) NOT NULL,
            currency TEXT DEFAULT 'eur',
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            paid_at TIMESTAMP WITH TIME ZONE,
            metadata JSONB
        );

        CREATE INDEX idx_orders_user_id ON public.orders(user_id);
        CREATE INDEX idx_orders_stripe_session ON public.orders(stripe_session_id);
        CREATE INDEX idx_orders_status ON public.orders(status);

        -- RLS
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own orders"
            ON public.orders FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own orders"
            ON public.orders FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        RAISE NOTICE 'Table "orders" créée avec succès.';
    ELSE
        RAISE NOTICE 'Table "orders" existe déjà.';
    END IF;

    -- Table order_items : items d'une commande
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        CREATE TABLE public.order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
            content_id UUID NOT NULL,
            content_type TEXT NOT NULL CHECK (content_type IN ('module', 'test', 'ressource', 'parcours')),
            title TEXT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
        CREATE INDEX idx_order_items_content ON public.order_items(content_id, content_type);

        -- RLS
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view order items from their orders"
            ON public.order_items FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.orders
                    WHERE orders.id = order_items.order_id
                    AND orders.user_id = auth.uid()
                )
            );

        RAISE NOTICE 'Table "order_items" créée avec succès.';
    ELSE
        RAISE NOTICE 'Table "order_items" existe déjà.';
    END IF;
END $$;



