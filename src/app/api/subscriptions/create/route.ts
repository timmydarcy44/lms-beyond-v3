import { NextRequest, NextResponse } from 'next/server';
// Stripe temporairement désactivé - sera configuré plus tard
// import { getServerClient } from '@/lib/supabase/server';
// import { getTenantFromHostname } from '@/lib/tenant/config';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
//   apiVersion: '2025-10-29.clover',
// });

export async function POST(request: NextRequest) {
  // Stripe temporairement désactivé
  return NextResponse.json(
    { error: 'Stripe temporairement désactivé - sera configuré plus tard' },
    { status: 503 }
  );
  
  /* STRIPE CODE COMMENTÉ - À RÉACTIVER PLUS TARD
  try {
    const { plan } = await request.json(); // 'monthly' | 'yearly'
    
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plan invalide. Choisissez "monthly" ou "yearly".' },
        { status: 400 }
      );
    }

    const hostname = request.headers.get('host') || '';
    const tenant = getTenantFromHostname(hostname);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant non trouvé' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié. Connectez-vous d\'abord.' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif pour ce tenant
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif pour ce service.' },
        { status: 400 }
      );
    }

    const price = tenant.subscriptionPlans[plan as 'monthly' | 'yearly'];
    const origin = request.nextUrl.origin;

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${tenant.name} - Abonnement ${plan === 'monthly' ? 'Mensuel' : 'Annuel'}`,
              description: `Accès complet à ${tenant.name}`,
              metadata: {
                tenant_id: tenant.id,
              },
            },
            unit_amount: Math.round(price * 100), // Stripe utilise les centimes
            recurring: {
              interval: plan === 'monthly' ? 'month' : 'year',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&subscription=success`,
      cancel_url: `${origin}/signup?subscription=canceled`,
      customer_email: user.email || undefined,
      metadata: {
        user_id: user.id,
        tenant_id: tenant.id,
        plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tenant_id: tenant.id,
          plan,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[subscriptions/create] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
  */
}

