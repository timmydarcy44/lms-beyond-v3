import { NextRequest, NextResponse } from 'next/server';
// Stripe temporairement désactivé - sera configuré plus tard
// import { getServerClient } from '@/lib/supabase/server';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
//   apiVersion: '2025-10-29.clover',
// });

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  // Stripe temporairement désactivé
  return NextResponse.json(
    { message: 'Stripe webhook temporairement désactivé' },
    { status: 503 }
  );
  
  /* STRIPE CODE COMMENTÉ - À RÉACTIVER PLUS TARD
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[subscriptions/webhook] Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Signature invalide' },
      { status: 400 }
    );
  }

  const supabase = await getServerClient();
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Service indisponible' },
      { status: 503 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const subscription = subscriptionResponse as Stripe.Subscription;

          const userId = session.metadata?.user_id;
          const tenantId = session.metadata?.tenant_id;
          const plan = session.metadata?.plan;

          if (!userId || !tenantId || !plan) {
            console.error('[subscriptions/webhook] Missing metadata:', { userId, tenantId, plan });
            break;
          }

          // Créer ou mettre à jour l'abonnement en base
          const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              tenant_id: tenantId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              stripe_price_id: subscription.items.data[0]?.price.id,
              plan,
              status: subscription.status === 'active' ? 'active' : 'inactive',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              metadata: {
                created: subscription.created,
                currency: subscription.currency,
              },
            }, {
              onConflict: 'stripe_subscription_id',
            });

          if (upsertError) {
            console.error('[subscriptions/webhook] Error upserting subscription:', upsertError);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;

        if (!tenantId) {
          console.error('[subscriptions/webhook] Missing tenant_id in subscription metadata');
          break;
        }

        // Mettre à jour l'abonnement en base
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 
                   subscription.status === 'canceled' ? 'canceled' :
                   subscription.status === 'past_due' ? 'past_due' :
                   subscription.status === 'trialing' ? 'trialing' : 'inactive',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            metadata: {
              updated: subscription.updated,
              currency: subscription.currency,
            },
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('[subscriptions/webhook] Error updating subscription:', updateError);
        }
        break;
      }

      default:
        console.log('[subscriptions/webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[subscriptions/webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    );
  }
  */
}

