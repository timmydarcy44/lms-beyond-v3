import { getServerClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";

/**
 * Récupère le compte Stripe Connect d'un utilisateur
 */
export async function getStripeConnectAccount(userId: string): Promise<string | null> {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return null;
    }
    const { data: account } = await supabase
      .from("stripe_connect_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", userId)
      .eq("charges_enabled", true)
      .maybeSingle();

    return account?.stripe_account_id || null;
  } catch (error) {
    console.error("[stripe/products] Error fetching Stripe Connect account:", error);
    return null;
  }
}

type ContentType = "ressource" | "test" | "module" | "parcours";

type CreateStripeProductParams = {
  title: string;
  description?: string;
  price: number;
  contentType: ContentType;
  contentId: string;
  metadata?: Record<string, string>;
  userId?: string; // ID de l'utilisateur créateur pour utiliser son compte Stripe Connect
};

/**
 * Crée un produit Stripe avec un prix associé
 * Retourne l'ID du produit Stripe et l'ID du prix Stripe
 */
export async function createStripeProduct({
  title,
  description,
  price,
  contentType,
  contentId,
  metadata = {},
  userId,
}: CreateStripeProductParams): Promise<{
  productId: string;
  priceId: string;
} | null> {
  try {
    const stripeClient = await getStripeClient();
    if (!stripeClient) {
      return null;
    }

    // Récupérer le compte Stripe Connect de l'utilisateur si fourni
    const connectedAccountId = userId ? await getStripeConnectAccount(userId) : null;

    // Créer le produit Stripe sur le compte connecté ou le compte de la plateforme
    const product = await stripeClient.products.create(
      {
        name: title,
        description: description || undefined,
        metadata: {
          content_type: contentType,
          content_id: contentId,
          ...metadata,
        },
      },
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
    );

    // Créer le prix associé au produit
    const priceObj = await stripeClient.prices.create(
      {
        product: product.id,
        unit_amount: Math.round(price * 100), // Stripe utilise les centimes
        currency: "eur",
        metadata: {
          content_type: contentType,
          content_id: contentId,
        },
      },
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
    );

    console.log("[stripe/products] Produit créé:", {
      productId: product.id,
      priceId: priceObj.id,
      contentType,
      contentId,
    });

    return {
      productId: product.id,
      priceId: priceObj.id,
    };
  } catch (error) {
    console.error("[stripe/products] Erreur lors de la création du produit Stripe:", error);
    return null;
  }
}

/**
 * Met à jour un produit Stripe existant
 */
export async function updateStripeProduct(
  productId: string,
  {
    title,
    description,
    price,
    metadata = {},
  }: {
    title?: string;
    description?: string;
    price?: number;
    metadata?: Record<string, string>;
  }
): Promise<{
  productId: string;
  priceId?: string;
} | null> {
  try {
    const stripeClient = await getStripeClient();
    if (!stripeClient) {
      return null;
    }

    // Mettre à jour le produit
    const updateData: any = {};
    if (title) updateData.name = title;
    if (description) updateData.description = description;
    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata;
    }

    const product = (updateData && Object.keys(updateData).length > 0)
      ? await stripeClient.products.update(productId, updateData)
      : await stripeClient.products.retrieve(productId);

    let priceId: string | undefined;

    // Si le prix a changé, créer un nouveau prix
    if (price !== undefined && price > 0) {
      // Récupérer les prix existants du produit
      const existingPrices = await stripeClient.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });

      // Si un prix existe déjà et qu'il est différent, le désactiver et créer un nouveau
      if (existingPrices.data.length > 0) {
        const existingPrice = existingPrices.data[0];
        const existingAmount = existingPrice.unit_amount ? existingPrice.unit_amount / 100 : 0;

        if (existingAmount !== price) {
          // Désactiver l'ancien prix
          await stripeClient.prices.update(existingPrice.id, { active: false });

          // Créer un nouveau prix
          const newPrice = await stripeClient.prices.create({
            product: productId,
            unit_amount: Math.round(price * 100),
            currency: "eur",
            metadata: existingPrice.metadata || {},
          });

          priceId = newPrice.id;
        } else {
          priceId = existingPrice.id;
        }
      } else {
        // Créer un nouveau prix si aucun n'existe
        const newPrice = await stripeClient.prices.create({
          product: productId,
          unit_amount: Math.round(price * 100),
          currency: "eur",
        });

        priceId = newPrice.id;
      }
    }

    return {
      productId: product.id,
      priceId,
    };
  } catch (error) {
    console.error("[stripe/products] Erreur lors de la mise à jour du produit Stripe:", error);
    return null;
  }
}

/**
 * Désactive un produit Stripe (ne le supprime pas, le rend juste inactif)
 */
export async function deactivateStripeProduct(productId: string): Promise<boolean> {
  try {
    const stripeClient = await getStripeClient();
    if (!stripeClient) {
      return false;
    }

    await stripeClient.products.update(productId, { active: false });
    return true;
  } catch (error) {
    console.error("[stripe/products] Erreur lors de la désactivation du produit Stripe:", error);
    return false;
  }
}

