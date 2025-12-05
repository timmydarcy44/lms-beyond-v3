import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import Stripe from "stripe";

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover",
  });
};

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_email, days_back = 30 } = body;

    if (!user_email) {
      return NextResponse.json(
        { error: "user_email requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 500 }
      );
    }

    // Trouver l'utilisateur
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", user_email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: `Utilisateur non trouvé pour l'email: ${user_email}` },
        { status: 404 }
      );
    }

    // Récupérer les sessions Stripe récentes pour cet email
    const cutoffDate = Math.floor((Date.now() - days_back * 24 * 60 * 60 * 1000) / 1000);
    
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: cutoffDate },
    });

    // Filtrer les sessions pour cet email et qui sont payées
    const userSessions = sessions.data.filter(
      (session) =>
        (session.customer_email === user_email ||
          session.customer_details?.email === user_email) &&
        session.payment_status === "paid"
    );

    console.log(`[admin/fix-past-purchases] Found ${userSessions.length} paid sessions for ${user_email}`);

    const results = [];
    const errors = [];

    for (const session of userSessions) {
      try {
        const metadata = session.metadata;
        let catalogItemId = metadata?.catalog_item_id || metadata?.itemId;

        // Si pas de catalog_item_id dans les métadonnées, chercher par URL de checkout
        if (!catalogItemId) {
          console.log(`[admin/fix-past-purchases] No catalog_item_id in metadata for session ${session.id}, trying to find via checkout URL...`);
          
          let catalogItems: any[] = [];
          
          // Essayer de trouver par l'URL complète dans success_url ou cancel_url
          const checkoutUrl = session.success_url || session.cancel_url || "";
          if (checkoutUrl) {
            // Chercher par URL complète
            const { data: itemsByUrl } = await supabase
              .from("catalog_items")
              .select("id, title, stripe_checkout_url")
              .eq("stripe_checkout_url", checkoutUrl)
              .limit(1);
            
            if (itemsByUrl && itemsByUrl.length > 0) {
              catalogItems = itemsByUrl;
            }
            
            // Si pas trouvé, essayer de trouver par l'ID de checkout dans l'URL (ex: buy.stripe.com/XXXXX)
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
            
            // Si toujours pas trouvé, essayer de trouver par l'ID de session dans l'URL
            if (catalogItems.length === 0) {
              const sessionIdMatch = checkoutUrl.match(/session_id=([a-zA-Z0-9_]+)/);
              if (sessionIdMatch) {
                const sessionIdInUrl = sessionIdMatch[1];
                // Chercher dans les catalog_items qui pourraient avoir cette session_id dans leur URL
                const { data: itemsBySessionId } = await supabase
                  .from("catalog_items")
                  .select("id, title, stripe_checkout_url")
                  .like("stripe_checkout_url", `%${sessionIdInUrl}%`)
                  .limit(1);
                
                if (itemsBySessionId && itemsBySessionId.length > 0) {
                  catalogItems = itemsBySessionId;
                }
              }
            }
          }

          if (catalogItems && catalogItems.length > 0) {
            catalogItemId = catalogItems[0].id;
            console.log(`[admin/fix-past-purchases] ✅ Found catalog_item_id via checkout URL: ${catalogItemId} for session ${session.id}`);
          } else {
            // Dernière tentative : chercher par montant payé (si le montant correspond à un prix d'item)
            const amountPaid = (session.amount_total || 0) / 100;
            if (amountPaid > 0) {
              console.log(`[admin/fix-past-purchases] Trying to find catalog_item by price: ${amountPaid}€`);
              
              // Chercher les items avec un prix correspondant (tolérance de 0.01€)
              const { data: itemsByPrice } = await supabase
                .from("catalog_items")
                .select("id, title, price, created_by")
                .eq("is_active", true)
                .gte("price", amountPaid - 0.01)
                .lte("price", amountPaid + 0.01)
                .limit(5); // Limiter à 5 résultats
              
              // Filtrer pour ne garder que ceux créés par Jessica Contentin
              const jessicaProfileId = "17364229-fe78-4986-ac69-41b880e34631";
              const jessicaItems = itemsByPrice?.filter((item: any) => 
                item.created_by === jessicaProfileId
              ) || [];
              
              if (jessicaItems.length === 1) {
                // Si un seul item correspond, l'utiliser
                catalogItemId = jessicaItems[0].id;
                console.log(`[admin/fix-past-purchases] ✅ Found catalog_item_id via price match: ${catalogItemId} (${jessicaItems[0].title}) for session ${session.id}`);
              } else if (jessicaItems.length > 1) {
                // Si plusieurs items correspondent, on ne peut pas être sûr, donc on met en erreur avec les suggestions
                console.warn(`[admin/fix-past-purchases] ⚠️ Multiple items found with price ${amountPaid}€, cannot auto-assign`);
                errors.push({
                  session_id: session.id,
                  error: "Multiple catalog items found with matching price. Please select manually.",
                  checkout_url: checkoutUrl,
                  amount: amountPaid,
                  suggested_items: jessicaItems.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                  })),
                });
                continue;
              }
            }
            
            // Si toujours pas trouvé, mettre en erreur
            if (!catalogItemId) {
              console.warn(`[admin/fix-past-purchases] ❌ Could not find catalog_item_id for session ${session.id} (no metadata, no matching checkout URL, no price match)`);
              errors.push({
                session_id: session.id,
                error: "No catalog_item_id in metadata and could not find via checkout URL or price. Please grant access manually.",
                checkout_url: checkoutUrl,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency,
                created: new Date(session.created * 1000).toISOString(),
              });
              continue;
            }
          }
        }

        // Vérifier si l'accès existe déjà
        const { data: existingAccess } = await supabase
          .from("catalog_access")
          .select("id")
          .eq("user_id", profile.id)
          .eq("catalog_item_id", catalogItemId)
          .maybeSingle();

        if (existingAccess) {
          console.log(`[admin/fix-past-purchases] Access already exists for session ${session.id}`);
          results.push({
            session_id: session.id,
            catalog_item_id: catalogItemId,
            status: "already_exists",
          });
          continue;
        }

        // Accorder l'accès
        const { error: accessError, data: accessData } = await supabase
          .from("catalog_access")
          .upsert({
            user_id: profile.id,
            catalog_item_id: catalogItemId,
            organization_id: null,
            access_status: "purchased",
            granted_at: new Date(session.created * 1000).toISOString(),
            transaction_id: session.payment_intent,
            purchase_amount: (session.amount_total || 0) / 100,
            purchase_date: new Date(session.created * 1000).toISOString(),
          }, {
            onConflict: "user_id,catalog_item_id",
          });

        if (accessError) {
          console.error(`[admin/fix-past-purchases] Error granting access for session ${session.id}:`, accessError);
          errors.push({
            session_id: session.id,
            catalog_item_id: catalogItemId,
            error: accessError.message,
          });
        } else {
          console.log(`[admin/fix-past-purchases] ✅ Access granted for session ${session.id}`);
          results.push({
            session_id: session.id,
            catalog_item_id: catalogItemId,
            status: "granted",
          });
        }
      } catch (error: any) {
        console.error(`[admin/fix-past-purchases] Error processing session ${session.id}:`, error);
        errors.push({
          session_id: session.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Traitement terminé pour ${user_email}`,
      summary: {
        total_sessions: userSessions.length,
        granted: results.filter((r) => r.status === "granted").length,
        already_exists: results.filter((r) => r.status === "already_exists").length,
        errors: errors.length,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[admin/fix-past-purchases] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}

