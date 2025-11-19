import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { CheckoutSuccessClient } from "@/components/catalogue/checkout-success-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  try {
    const Stripe = require("stripe").default;
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia" as any,
    });
  } catch (error) {
    console.error("[stripe] Error initializing Stripe:", error);
    return null;
  }
}

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/dashboard/catalogue");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  try {
    // Vérifier que Stripe est configuré
    const stripe = getStripeClient();
    if (!stripe) {
      // Si Stripe n'est pas configuré, rediriger vers le catalogue
      console.warn("[checkout/success] Stripe n'est pas configuré, redirection vers le catalogue");
      redirect("/dashboard/catalogue");
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      redirect("/dashboard/catalogue/checkout");
    }

    // Récupérer la commande
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      // Créer la commande si elle n'existe pas
      const metadata = session.metadata || {};
      const items = metadata.items ? JSON.parse(metadata.items) : [];

      const { data: newOrder } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          stripe_session_id: sessionId,
          stripe_payment_intent_id: session.payment_intent as string || null,
          total_amount: (session.amount_total || 0) / 100,
          currency: session.currency || "eur",
          status: "paid",
          paid_at: new Date().toISOString(),
          metadata: {
            items: items,
          },
        })
        .select()
        .single();

      if (newOrder && items.length > 0) {
        // Créer les order_items
        const orderItems = items.map((item: any) => ({
          order_id: newOrder.id,
          content_id: item.content_id,
          content_type: item.content_type,
          title: item.title || "",
          price: item.price || 0,
        }));

        await supabase.from("order_items").insert(orderItems);

        // Accorder l'accès aux contenus selon leur type
        for (const item of items) {
          if (item.content_type === "module") {
            // Pour les modules (courses), créer un enrollment
            await supabase
              .from("enrollments")
              .upsert({
                user_id: user.id,
                course_id: item.content_id,
                enrolled_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,course_id",
              });
          } else if (item.content_type === "parcours") {
            // Pour les parcours, créer un path_progress
            await supabase
              .from("path_progress")
              .upsert({
                user_id: user.id,
                path_id: item.content_id,
                started_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,path_id",
              });
          }
          // Pour tests et ressources, utiliser catalog_access si disponible
          try {
            await supabase
              .from("catalog_access")
              .upsert({
                user_id: user.id,
                catalog_item_id: item.content_id,
                access_type: "purchased",
                granted_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,catalog_item_id",
              });
          } catch (error) {
            console.log("[checkout/success] catalog_access may not exist, skipping");
          }
        }

        // Vider le panier
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);
      }

      return <CheckoutSuccessClient orderId={newOrder?.id || null} />;
    }

    // Si la commande existe déjà, vérifier si elle est payée
    if (order.status !== "paid") {
      // Mettre à jour la commande
      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: session.payment_intent as string || null,
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // Créer les order_items si elles n'existent pas
      const { data: existingItems } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order.id)
        .limit(1);

      if (!existingItems || existingItems.length === 0) {
        const items = order.metadata?.items || [];
        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          content_id: item.content_id,
          content_type: item.content_type,
          title: item.title || "",
          price: item.price || 0,
        }));

        await supabase.from("order_items").insert(orderItems);

        // Accorder l'accès aux contenus selon leur type
        for (const item of items) {
          if (item.content_type === "module") {
            // Pour les modules (courses), créer un enrollment
            await supabase
              .from("enrollments")
              .upsert({
                user_id: user.id,
                course_id: item.content_id,
                enrolled_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,course_id",
              });
          } else if (item.content_type === "parcours") {
            // Pour les parcours, créer un path_progress
            await supabase
              .from("path_progress")
              .upsert({
                user_id: user.id,
                path_id: item.content_id,
                started_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,path_id",
              });
          }
          // Pour tests et ressources, utiliser catalog_access si disponible
          try {
            await supabase
              .from("catalog_access")
              .upsert({
                user_id: user.id,
                catalog_item_id: item.content_id,
                access_type: "purchased",
                granted_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,catalog_item_id",
              });
          } catch (error) {
            console.log("[checkout/success] catalog_access may not exist, skipping");
          }
        }
      }

      // Vider le panier
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
    }

    return <CheckoutSuccessClient orderId={order.id} />;
  } catch (error) {
    console.error("[checkout/success] Error:", error);
    redirect("/dashboard/catalogue");
  }
}

