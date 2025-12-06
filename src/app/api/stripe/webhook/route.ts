import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail } from "@/lib/emails/send";
import Stripe from "stripe";

// Initialiser Stripe uniquement si la clé est disponible
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover",
  });
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe/webhook] Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Gérer l'événement checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Vérifier que le paiement est réussi
      if (session.payment_status !== "paid") {
        console.log("[stripe/webhook] Payment not completed, skipping");
        return NextResponse.json({ received: true });
      }

      // Récupérer les métadonnées de la session
      const metadata = session.metadata;
      const customerEmail = session.customer_email || session.customer_details?.email;

      if (!customerEmail) {
        console.error("[stripe/webhook] No customer email found");
        return NextResponse.json({ received: true });
      }

      // Utiliser le service role client pour contourner RLS dans le webhook
      const supabase = getServiceRoleClient();
      if (!supabase) {
        console.error("[stripe/webhook] Supabase not configured");
        return NextResponse.json({ received: true });
      }

      console.log("[stripe/webhook] Processing payment for email:", customerEmail);

      // Trouver l'utilisateur par email
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", customerEmail)
        .maybeSingle();
      
      if (profileError) {
        console.error("[stripe/webhook] Error finding user:", profileError);
        return NextResponse.json({ received: true });
      }
      
      if (!profile) {
        console.warn("[stripe/webhook] WARNING: User not found for email:", customerEmail);
        console.warn("[stripe/webhook] Attempting to create user account automatically...");
        
        // Créer automatiquement un compte utilisateur si l'email n'existe pas
        // Cela permet aux nouveaux clients d'acheter sans avoir de compte préalable
        try {
          // Générer un mot de passe aléatoire (l'utilisateur pourra le réinitialiser)
          const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + "A1!";
          
          // Créer l'utilisateur dans Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            password: randomPassword,
            email_confirm: true, // Confirmer automatiquement l'email
          });
          
          if (authError || !authData.user) {
            console.error("[stripe/webhook] ❌ Error creating user:", authError);
            // Ne pas bloquer le webhook, on essaiera de créer l'accès plus tard
            return NextResponse.json({ 
              received: true,
              warning: "User not found and could not be created automatically. Manual intervention may be required."
            });
          }
          
          // Créer le profil
          const { data: newProfile, error: profileError2 } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              email: customerEmail,
              full_name: session.customer_details?.name || customerEmail.split("@")[0],
            })
            .select("id, email")
            .single();
          
          if (profileError2 || !newProfile) {
            console.error("[stripe/webhook] ❌ Error creating profile:", profileError2);
            // L'utilisateur existe dans Auth mais pas dans profiles, utiliser l'ID de Auth
            profile = { id: authData.user.id, email: customerEmail };
          } else {
            profile = newProfile;
            console.log("[stripe/webhook] ✅ User and profile created automatically:", profile.id);
          }
        } catch (createError: any) {
          console.error("[stripe/webhook] ❌ Error in user creation process:", createError);
          // Ne pas bloquer le webhook, on essaiera de créer l'accès plus tard
          return NextResponse.json({ 
            received: true,
            warning: "User creation failed. Manual intervention may be required."
          });
        }
      }
      
      if (!profile) {
        console.error("[stripe/webhook] ❌ Could not find or create user for email:", customerEmail);
        return NextResponse.json({ 
          received: true,
          error: "User not found and creation failed"
        });
      }

      // Si on a un catalog_item_id dans les métadonnées, accorder l'accès directement
      // Support à la fois itemId (ancien format) et catalog_item_id (nouveau format)
      const catalogItemId = metadata?.catalog_item_id || metadata?.itemId;
      const itemType = metadata?.item_type || metadata?.itemType;
      
      console.log("[stripe/webhook] Metadata extracted:", {
        catalog_item_id: metadata?.catalog_item_id,
        itemId: metadata?.itemId,
        item_type: metadata?.item_type,
        itemType: metadata?.itemType || itemType,
        catalogItemId,
        user_id: metadata?.user_id,
        profile_id: profile.id,
      });
      
      if (catalogItemId && itemType) {
        console.log("[stripe/webhook] Granting access for catalog_item_id:", catalogItemId, "to user:", profile.id);
        
        const { error: accessError, data: accessData } = await supabase
          .from("catalog_access")
          .upsert({
            user_id: profile.id,
            catalog_item_id: catalogItemId,
            organization_id: null, // B2C, pas d'organisation
            access_status: "purchased",
            granted_at: new Date().toISOString(),
            transaction_id: session.payment_intent,
            purchase_amount: (session.amount_total || 0) / 100, // Convertir de centimes en euros
            purchase_date: new Date().toISOString(),
          }, {
            onConflict: "user_id,catalog_item_id",
          });

        if (accessError) {
          console.error("[stripe/webhook] ❌ Error granting access:", accessError);
          console.error("[stripe/webhook] Error details:", {
            code: accessError.code,
            message: accessError.message,
            details: accessError.details,
            hint: accessError.hint,
          });
        } else {
          console.log("[stripe/webhook] ✅ Access granted successfully for item:", catalogItemId, "to user:", profile.id);
          console.log("[stripe/webhook] Access data:", accessData);
          
          // Envoyer l'email de confirmation d'achat
          try {
            const { data: catalogItem } = await supabase
              .from("catalog_items")
              .select("id, title, price, item_type, content_id")
              .eq("id", catalogItemId)
              .maybeSingle();
            
            if (catalogItem) {
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", profile.id)
                .maybeSingle();
              
              const firstName = userProfile?.full_name?.split(" ")[0] || null;
              
              // Construire le lien direct vers la ressource
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
              const resourceLink = `${baseUrl}/ressources/${catalogItem.id}`;
              
              await sendPurchaseConfirmationEmail(
                customerEmail,
                firstName,
                catalogItem.title,
                catalogItem.price || 0,
                undefined, // purchaseDate (sera généré automatiquement)
                resourceLink // Lien direct vers la ressource
              );
            }
          } catch (emailError) {
            console.error("[stripe/webhook] Error sending purchase confirmation email:", emailError);
            // Ne pas échouer le webhook si l'email échoue
          }
        }
      } else {
        // Si pas de métadonnées, chercher le catalog_item par l'URL Stripe Checkout
        // Extraire l'ID de checkout de l'URL (ex: dRmdRaeay8Ni8Sg8bh33W01)
        let catalogItems: any[] = [];
        
        // Essayer de trouver par l'URL complète dans success_url ou cancel_url
        const checkoutUrl = session.success_url || session.cancel_url || "";
        if (checkoutUrl) {
          const { data: itemsByUrl } = await supabase
            .from("catalog_items")
            .select("id, title, stripe_checkout_url")
            .eq("stripe_checkout_url", checkoutUrl)
            .limit(1);
          
          if (itemsByUrl && itemsByUrl.length > 0) {
            catalogItems = itemsByUrl;
          }
        }
        
        // Si pas trouvé, essayer de trouver par l'ID de checkout dans l'URL
        if (catalogItems.length === 0) {
          const checkoutIdMatch = checkoutUrl.match(/buy\.stripe\.com\/([a-zA-Z0-9]+)/);
          if (checkoutIdMatch) {
            const checkoutId = checkoutIdMatch[1];
            const { data: itemsByPattern } = await supabase
              .from("catalog_items")
              .select("id, title, stripe_checkout_url")
              .like("stripe_checkout_url", `%${checkoutId}%`)
              .limit(1);
            
            if (itemsByPattern && itemsByPattern.length > 0) {
              catalogItems = itemsByPattern;
            }
          }
        }

        if (catalogItems && catalogItems.length > 0) {
          const catalogItem = catalogItems[0];
          
          const { error: accessError } = await supabase
            .from("catalog_access")
            .upsert({
              user_id: profile.id,
              catalog_item_id: catalogItem.id,
              organization_id: null, // B2C, pas d'organisation
              access_status: "purchased",
              granted_at: new Date().toISOString(),
              transaction_id: session.payment_intent,
              purchase_amount: (session.amount_total || 0) / 100, // Convertir de centimes en euros
              purchase_date: new Date().toISOString(),
            }, {
              onConflict: "user_id,catalog_item_id",
            });

          if (accessError) {
            console.error("[stripe/webhook] Error granting access:", accessError);
          } else {
            console.log("[stripe/webhook] Access granted for catalog item:", catalogItem.title);
            
            // Envoyer l'email de confirmation d'achat
            try {
              const { data: fullCatalogItem } = await supabase
                .from("catalog_items")
                .select("id, title, price")
                .eq("id", catalogItem.id)
                .maybeSingle();
              
              if (fullCatalogItem) {
                const { data: userProfile } = await supabase
                  .from("profiles")
                  .select("full_name")
                  .eq("id", profile.id)
                  .maybeSingle();
                
                const firstName = userProfile?.full_name?.split(" ")[0] || null;
                
                // Construire le lien direct vers la ressource
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
                const resourceLink = `${baseUrl}/ressources/${fullCatalogItem.id}`;
                
                await sendPurchaseConfirmationEmail(
                  customerEmail,
                  firstName,
                  fullCatalogItem.title,
                  fullCatalogItem.price || 0,
                  undefined, // purchaseDate (sera généré automatiquement)
                  resourceLink // Lien direct vers la ressource
                );
              }
            } catch (emailError) {
              console.error("[stripe/webhook] Error sending purchase confirmation email:", emailError);
              // Ne pas échouer le webhook si l'email échoue
            }
          }
        } else {
          console.warn("[stripe/webhook] WARNING: No catalog item found for checkout URL:", checkoutUrl);
          console.warn("[stripe/webhook] Session metadata:", metadata);
          console.warn("[stripe/webhook] Session success_url:", session.success_url);
          console.warn("[stripe/webhook] Session cancel_url:", session.cancel_url);
        }
        
        // Si pas de catalog_item_id dans les métadonnées et pas trouvé via URL
        if (!catalogItemId) {
          console.warn("[stripe/webhook] WARNING: No catalog_item_id or itemId in metadata");
          console.warn("[stripe/webhook] Available metadata:", metadata);
          console.warn("[stripe/webhook] Session ID:", session.id);
          console.warn("[stripe/webhook] Customer email:", customerEmail);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe/webhook] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

