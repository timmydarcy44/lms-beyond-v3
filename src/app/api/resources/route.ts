import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { syncCatalogItem } from "@/lib/utils/sync-catalog-item";
import { createStripeProduct, updateStripeProduct } from "@/lib/stripe/products";
import { sendPurchaseConfirmationEmail } from "@/lib/emails/send";

export async function POST(request: NextRequest) {
  try {
    console.log("[api/resources] Requête reçue");
    
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[api/resources] Supabase non configuré");
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[api/resources] Erreur d'authentification:", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("[api/resources] Utilisateur authentifié:", user.id);

    // Vérifier si c'est FormData (upload de fichier) ou JSON
    const contentType = request.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    let body: any;
    let pdfFile: File | null = null;

    if (isFormData) {
      // Parser FormData
      const formData = await request.formData();
      body = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as string,
        price: formData.get("price") ? parseFloat(formData.get("price") as string) : 0,
        category: formData.get("category") as string,
        cover_image_url: formData.get("cover_image_url") as string,
        published: formData.get("published") === "true",
      };
      pdfFile = formData.get("file") as File | null;
      console.log("[api/resources] FormData reçu, fichier PDF:", pdfFile?.name);
    } else {
      // Parser JSON
      try {
        body = await request.json();
        console.log("[api/resources] Corps de la requête JSON:", { ...body, title: body?.title });
      } catch (parseError) {
        console.error("[api/resources] Erreur de parsing JSON:", parseError);
        return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
      }
    }

    const { 
      resourceId, 
      published = false,
      // Données pour la création
      title,
      description,
      type,
      slug,
      price,
      category,
      cover_image_url,
    } = body as {
      resourceId?: string;
      published?: boolean;
      title?: string;
      description?: string;
      type?: string;
      slug?: string;
      price?: number;
      category?: string;
      cover_image_url?: string | null;
    };

    // Si pas de resourceId, c'est une création
    if (!resourceId) {
      if (!title || !title.trim()) {
        return NextResponse.json({ error: "Titre de ressource requis" }, { status: 400 });
      }

      // Vérifier si l'utilisateur est Super Admin
      const { data: superAdmin } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const isSuperAdmin = !!superAdmin;

      // Récupérer l'org_id de l'utilisateur depuis org_memberships
      // On prend la première organisation où l'utilisateur est instructor, admin ou tutor
      let userOrgId: string | null = null;
      
      if (!isSuperAdmin) {
        try {
          const { data: memberships } = await supabase
            .from("org_memberships")
            .select("org_id, role")
            .eq("user_id", user.id)
            .in("role", ["instructor", "admin", "tutor"])
            .limit(1);

          if (memberships && memberships.length > 0) {
            userOrgId = memberships[0].org_id;
            console.log("[api/resources] Org ID trouvé:", userOrgId);
          } else {
            console.warn("[api/resources] Aucune organisation trouvée pour l'utilisateur");
            // Si aucun membership n'est trouvé, essayer aussi avec le rôle "learner"
            const { data: learnerMemberships } = await supabase
              .from("org_memberships")
              .select("org_id")
              .eq("user_id", user.id)
              .eq("role", "learner")
              .limit(1);
            
            if (learnerMemberships && learnerMemberships.length > 0) {
              userOrgId = learnerMemberships[0].org_id;
              console.log("[api/resources] Org ID trouvé (learner):", userOrgId);
            }
          }
        } catch (orgError) {
          console.error("[api/resources] Erreur lors de la récupération de l'org_id:", orgError);
        }
      } else {
        // Pour les Super Admins, récupérer leur première organisation ou créer une organisation par défaut
        const { data: memberships } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1);

        if (memberships && memberships.length > 0) {
          userOrgId = memberships[0].org_id;
          console.log("[api/resources] Org ID trouvé pour Super Admin:", userOrgId);
        } else {
          // Créer une organisation par défaut pour le Super Admin
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", user.id)
            .single();

          const orgName = profile?.full_name || profile?.email || "Organisation Super Admin";
          
          // Utiliser le service role client pour bypasser RLS lors de la création d'organisation
          const { getServiceRoleClient } = await import("@/lib/supabase/server");
          const serviceClient = getServiceRoleClient();
          
          // Si service client disponible, l'utiliser pour bypasser RLS
          const clientToUse = serviceClient || supabase;
          
          // Essayer d'abord avec description, puis sans si la colonne n'existe pas
          let orgCreateResult = await clientToUse
            .from("organizations")
            .insert({
              name: orgName,
              description: "Organisation par défaut pour Super Admin",
            })
            .select()
            .single();

          // Si erreur liée à description, réessayer sans
          if (orgCreateResult.error && (
            orgCreateResult.error.message?.includes("description") || 
            orgCreateResult.error.code === "42703" ||
            orgCreateResult.error.message?.includes("Could not find")
          )) {
            console.log("[api/resources] Colonne description non trouvée, création sans description");
            orgCreateResult = await clientToUse
              .from("organizations")
              .insert({
                name: orgName,
              })
              .select()
              .single();
          }

          const { data: newOrg, error: orgCreateError } = orgCreateResult;

          if (!orgCreateError && newOrg) {
            userOrgId = newOrg.id;
            // Ajouter le Super Admin comme admin de cette organisation
            await supabase
              .from("org_memberships")
              .insert({
                user_id: user.id,
                org_id: newOrg.id,
                role: "admin",
              });
            console.log("[api/resources] Organisation créée pour Super Admin:", userOrgId);
          } else {
            console.error("[api/resources] Erreur lors de la création de l'organisation:", orgCreateError);
          }
        }
      }
      
      // Si org_id est requis mais non trouvé, créer une organisation d'urgence
      if (!userOrgId) {
        console.warn("[api/resources] Aucun org_id trouvé, création d'organisation d'urgence");
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", user.id)
          .maybeSingle();

        const orgName = profile?.full_name || profile?.email || `Organisation ${user.id.substring(0, 8)}`;
        
        // Utiliser le service role client pour bypasser RLS lors de la création d'organisation
        const { getServiceRoleClient } = await import("@/lib/supabase/server");
        const serviceClient = getServiceRoleClient();
        const clientToUse = serviceClient || supabase;
        
        // Essayer d'abord avec description, puis sans si la colonne n'existe pas
        let emergencyOrgResult = await clientToUse
          .from("organizations")
          .insert({
            name: orgName,
            description: "Organisation créée automatiquement",
          })
          .select()
          .single();

        // Si erreur liée à description, réessayer sans
        if (emergencyOrgResult.error && (
          emergencyOrgResult.error.message?.includes("description") || 
          emergencyOrgResult.error.code === "42703" ||
          emergencyOrgResult.error.message?.includes("Could not find")
        )) {
          console.log("[api/resources] Colonne description non trouvée, création d'urgence sans description");
          emergencyOrgResult = await clientToUse
            .from("organizations")
            .insert({
              name: orgName,
            })
            .select()
            .single();
        }

        const { data: emergencyOrg, error: emergencyError } = emergencyOrgResult;

        if (!emergencyError && emergencyOrg) {
          userOrgId = emergencyOrg.id;
          // Ajouter l'utilisateur comme admin
          await supabase
            .from("org_memberships")
            .insert({
              user_id: user.id,
              org_id: emergencyOrg.id,
              role: isSuperAdmin ? "admin" : "instructor",
            });
          console.log("[api/resources] Organisation d'urgence créée:", userOrgId);
        } else {
          console.error("[api/resources] Impossible de créer une organisation d'urgence:", emergencyError);
          return NextResponse.json({ 
            error: "Impossible de créer une organisation", 
            details: emergencyError?.message || "Erreur inconnue lors de la création de l'organisation"
          }, { status: 500 });
        }
      }

      // Créer la ressource
      // Stratégie : essayer différentes combinaisons de colonnes selon ce qui existe
      const baseData: any = {
        title: title.trim(),
      };

      // Ajouter org_id (doit être défini maintenant)
      if (userOrgId) {
        baseData.org_id = userOrgId;
      } else {
        // Si toujours pas d'org_id, c'est une erreur critique
        console.error("[api/resources] Erreur critique: org_id toujours null après toutes les tentatives");
        return NextResponse.json({ 
          error: "Impossible de déterminer l'organisation", 
          details: "Aucune organisation n'a pu être trouvée ou créée pour cet utilisateur"
        }, { status: 500 });
      }

      // Ajouter description si non vide
      if (description?.trim()) {
        baseData.description = description.trim();
      }

      // Ajouter prix si fourni (on essaiera, mais si la colonne n'existe pas, on continuera)
      // Le prix sera ajouté dans toutes les tentatives, mais si la colonne n'existe pas, l'erreur sera ignorée
      if (price !== undefined && price !== null) {
        baseData.price = parseFloat(String(price)) || 0;
      }

      // Ajouter l'image de couverture si fournie
      if (cover_image_url) {
        // Essayer différentes colonnes possibles pour l'image
        baseData.cover_image_url = cover_image_url;
        baseData.hero_image_url = cover_image_url;
        baseData.cover_url = cover_image_url;
        baseData.thumbnail_url = cover_image_url;
      }

      // Note: category n'existe pas dans la table resources
      // Elle sera gérée lors de la synchronisation avec catalog_items

      // Essayer différentes combinaisons (ordre optimal)
      // On essaie d'abord les combinaisons les plus probables
      const attempts = [
        // Tentative 1: Avec org_id, created_by, status et type (combinaison la plus courante)
        { ...baseData, created_by: user.id, status: published ? "published" : "draft", type: type || "guide" },
        // Tentative 2: Avec org_id, created_by et status, sans type
        { ...baseData, created_by: user.id, status: published ? "published" : "draft" },
        // Tentative 3: Avec org_id, created_by et published (boolean)
        { ...baseData, created_by: user.id, published },
        // Tentative 4: Avec org_id, created_by seulement
        { ...baseData, created_by: user.id },
        // Tentative 5: Avec org_id, owner_id
        { ...baseData, owner_id: user.id },
        // Tentative 6: Avec org_id, creator_id
        { ...baseData, creator_id: user.id },
        // Tentative 7: Avec org_id, created_by, status et resource_type au lieu de type
        { ...baseData, created_by: user.id, status: published ? "published" : "draft", resource_type: type || "guide" },
        // Tentative 8: Avec org_id, created_by, status et kind au lieu de type
        { ...baseData, created_by: user.id, status: published ? "published" : "draft", kind: type || "guide" },
        // Tentative 9: Avec org_id seulement (dernier recours)
        { ...baseData },
      ];

      let data = null;
      let error = null;
      let successAttempt = null;

      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        console.log(`[api/resources] Tentative ${i + 1}/${attempts.length} avec colonnes:`, Object.keys(attempt));
        
        try {
          const result = await supabase
            .from("resources")
            .insert(attempt)
            .select()
            .single();
          
          if (!result.error) {
            data = result.data;
            error = null;
            successAttempt = attempt;
            console.log("[api/resources] ✓ Succès avec colonnes:", Object.keys(attempt));
            break;
          } else {
            error = result.error;
            const errorMsg = result.error.message?.toLowerCase() || "";
            console.log(`[api/resources] ✗ Échec tentative ${i + 1}:`, result.error.message);
            
            // Si l'erreur est liée à la colonne price, retirer price et réessayer
            if (errorMsg.includes("price") && result.error.code === "42703") {
              console.log("[api/resources] Colonne price non trouvée, retrait du prix et nouvelle tentative");
              delete attempt.price;
              const retryResult = await supabase
                .from("resources")
                .insert(attempt)
                .select()
                .single();
              
              if (!retryResult.error) {
                data = retryResult.data;
                error = null;
                successAttempt = attempt;
                console.log("[api/resources] ✓ Succès après retrait du prix");
                break;
              }
            }
            
            // Si l'erreur n'est pas liée à une colonne manquante, arrêter les tentatives
            if (!errorMsg.includes("column") && result.error.code !== "42703" && !errorMsg.includes("null")) {
              console.log("[api/resources] Erreur non liée à une colonne, arrêt des tentatives");
              break;
            }
          }
        } catch (e) {
          console.error(`[api/resources] Exception lors de la tentative ${i + 1}:`, e);
          error = e instanceof Error ? { message: e.message } : { message: "Exception inconnue" };
          break;
        }
      }

      // Si création réussie, essayer de mettre à jour avec les colonnes optionnelles
      if (!error && data && data.id) {
        const updateData: any = {};
        let needsUpdate = false;
        
        // Ajouter status ou published si possible
        try {
          updateData.status = published ? "published" : "draft";
          needsUpdate = true;
        } catch {
          try {
            updateData.published = published;
            needsUpdate = true;
          } catch {}
        }
        
        // Ajouter type si fourni
        if (type) {
          try {
            updateData.kind = type;
            needsUpdate = true;
          } catch {
            try {
              updateData.type = type;
              needsUpdate = true;
            } catch {
              try {
                updateData.resource_type = type;
                needsUpdate = true;
              } catch {}
            }
          }
        }
        
        // Mettre à jour si nécessaire (on ignore les erreurs car c'est optionnel)
        if (needsUpdate) {
          const updateResult = await supabase
            .from("resources")
            .update(updateData)
            .eq("id", data.id)
            .select()
            .single();
          
          if (!updateResult.error && updateResult.data) {
            data = updateResult.data;
          }
        }

        // Créer automatiquement un produit Stripe si un prix > 0 est défini
        let stripeProduct: { productId: string; priceId: string; checkoutUrl?: string } | null = null;
        if (data && data.id && price !== undefined && price !== null && price > 0) {
          try {
            stripeProduct = await createStripeProduct({
              title: title.trim(),
              description: description?.trim() || undefined,
              price: parseFloat(String(price)),
              contentType: "ressource",
              contentId: data.id,
              userId: user.id,
              metadata: {
                resource_id: data.id,
                org_id: userOrgId || "",
              },
            });

            if (stripeProduct) {
              // Mettre à jour la ressource avec les IDs Stripe
              await supabase
                .from("resources")
                .update({
                  stripe_product_id: stripeProduct.productId,
                  stripe_price_id: stripeProduct.priceId,
                })
                .eq("id", data.id);

              console.log("[api/resources] Produit Stripe créé:", stripeProduct);
            }
          } catch (stripeError) {
            console.error("[api/resources] Erreur lors de la création du produit Stripe:", stripeError);
            // Ne pas bloquer la création de la ressource si Stripe échoue
          }
        }

        // Uploader le PDF si type === "pdf" et qu'un fichier est fourni
        let pdfUrl: string | null = null;
        if (type === "pdf" && pdfFile) {
          try {
            console.log("[api/resources] Upload du PDF:", pdfFile.name);
            const serviceClient = getServiceRoleClient();
            if (!serviceClient) {
              console.error("[api/resources] Service role client non disponible pour l'upload PDF");
            } else {
              // Générer un nom de fichier unique
              const originalFileName = pdfFile.name.split(".")[0];
              const sanitizedFileName = originalFileName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/--+/g, "-")
                .trim();
              const timestamp = Date.now();
              const fileName = `${sanitizedFileName}-${timestamp}.pdf`;

              // Convertir le File en ArrayBuffer
              const arrayBuffer = await pdfFile.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // Upload vers Supabase Storage (bucket "pdfs")
              const { data: uploadData, error: uploadError } = await serviceClient.storage
                .from("pdfs")
                .upload(fileName, buffer, {
                  contentType: "application/pdf",
                  cacheControl: "3600",
                  upsert: false,
                });

              if (uploadError) {
                console.error("[api/resources] Erreur lors de l'upload du PDF:", uploadError);
              } else {
                // Récupérer l'URL publique
                const { data: { publicUrl } } = serviceClient.storage
                  .from("pdfs")
                  .getPublicUrl(fileName);
                pdfUrl = publicUrl;
                console.log("[api/resources] PDF uploadé avec succès:", pdfUrl);

                // Mettre à jour la ressource avec l'URL du PDF et kind = "pdf"
                await supabase
                  .from("resources")
                  .update({ 
                    file_url: pdfUrl,
                    kind: "pdf",
                  })
                  .eq("id", data.id);
                console.log("[api/resources] Ressource mise à jour avec file_url et kind");
              }
            }
          } catch (pdfError) {
            console.error("[api/resources] Erreur lors de l'upload du PDF:", pdfError);
            // Ne pas bloquer la création si l'upload PDF échoue
          }
        }

        // Synchroniser avec catalog_items si Super Admin
        let catalogItemId: string | null = null;
        if (data && data.id) {
          try {
            // Vérifier si c'est contentin.cabinet@gmail.com
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", user.id)
              .maybeSingle();

            const isContentin = profile?.email === "contentin.cabinet@gmail.com";

            // Synchroniser avec catalog_items et récupérer le catalogItemId
            const syncResult = await syncCatalogItem({
              supabase,
              userId: user.id,
              contentId: data.id,
              itemType: "ressource",
              title: title.trim(),
              description: description?.trim() || null,
              shortDescription: description ? description.substring(0, 150) : null,
              price: price || 0,
              category: category || null,
              heroImage: cover_image_url || null,
              thumbnailUrl: cover_image_url || null,
              targetAudience: isContentin ? "apprenant" : "apprenant", // Toujours "apprenant" pour contentin
              assignmentType: isContentin ? "no_school" : "no_school", // Toujours "no_school" pour contentin
              status: published ? "published" : "draft",
              stripeCheckoutUrl: stripeProduct?.checkoutUrl || null, // Passer l'URL de checkout Stripe
            });

            // Récupérer le catalogItemId depuis le résultat de la synchronisation
            if (syncResult.success && syncResult.catalogItemId) {
              catalogItemId = syncResult.catalogItemId;
              console.log("[api/resources] Catalog item ID récupéré:", catalogItemId);
            } else {
              // Si la synchronisation n'a pas retourné d'ID, essayer de le récupérer manuellement
              const { data: catalogItem } = await supabase
                .from("catalog_items")
                .select("id")
                .eq("content_id", data.id)
                .eq("item_type", "ressource")
                .maybeSingle();
              
              if (catalogItem?.id) {
                catalogItemId = catalogItem.id;
                console.log("[api/resources] Catalog item ID récupéré manuellement:", catalogItemId);
              }
            }

            // Si la ressource est créée avec un PDF ET publiée, envoyer un email de confirmation d'achat à timmydarcy44@gmail.com
            if (type === "pdf" && pdfUrl && data.id && published) {
              try {
                // Utiliser directement l'URL du PDF au lieu de la page de ressource
                const finalResourceLink = pdfUrl; // L'URL directe du PDF dans Supabase Storage

                console.log("[api/resources] Envoi de l'email avec le lien direct vers le PDF:", finalResourceLink);

                await sendPurchaseConfirmationEmail(
                  "timmydarcy44@gmail.com",
                  "Timmy", // Prénom
                  title.trim(),
                  price || 0,
                  new Date().toLocaleDateString("fr-FR"),
                  finalResourceLink
                );
                console.log("[api/resources] ✅ Email de confirmation d'achat envoyé à timmydarcy44@gmail.com avec le lien direct vers le PDF:", finalResourceLink);
              } catch (emailError) {
                console.error("[api/resources] Erreur lors de l'envoi de l'email:", emailError);
                // Ne pas bloquer la création si l'email échoue
              }
            }
          } catch (syncError) {
            console.error("[api/resources] Erreur lors de la synchronisation avec catalog_items:", syncError);
            // Ne pas bloquer la création si la synchronisation échoue
          }
        }
      }

      if (error) {
        console.error("[api/resources] Erreur finale lors de la création:", error);
        console.error("[api/resources] Code erreur:", error.code);
        console.error("[api/resources] Message erreur:", error.message);
        console.error("[api/resources] Détails erreur:", error.details);
        console.error("[api/resources] Hint erreur:", error.hint);
        
        return NextResponse.json({ 
          error: "Erreur lors de la création", 
          details: error.message || "Erreur inconnue",
          code: error.code,
          hint: error.hint,
        }, { status: 500 });
      }

      console.log("[api/resources] Ressource créée avec succès:", data?.id);
      return NextResponse.json({ 
        success: true, 
        resource: data,
        message: published ? "Ressource créée et publiée avec succès" : "Ressource créée en brouillon"
      });
    }

    // Vérifier que la ressource existe et appartient au formateur
    const { data: existingResource, error: checkError } = await supabase
      .from("resources")
      .select("id, created_by, owner_id")
      .eq("id", resourceId)
      .single();

    if (checkError || !existingResource) {
      return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
    }

    // Vérifier la propriété
    const isOwner = existingResource.created_by === user.id || 
                   (existingResource.owner_id && existingResource.owner_id === user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à modifier cette ressource" }, { status: 403 });
    }

    // Mettre à jour le statut de publication
    // La table resources utilise 'status' (text: 'draft' | 'published') selon les migrations
    // Mais certaines structures peuvent utiliser 'published' (boolean)
    // On essaie d'abord avec 'status', puis avec 'published' si l'erreur indique que la colonne n'existe pas
    let updateData: any = {
      status: published ? "published" : "draft",
    };
    
    let { data, error } = await supabase
      .from("resources")
      .update(updateData)
      .eq("id", resourceId)
      .select()
      .single();
    
    // Si l'erreur indique que la colonne 'status' n'existe pas, essayer avec 'published' (boolean)
    if (error && (error.message?.includes("column") || error.code === "42703")) {
      console.log("[api/resources] Colonne 'status' non trouvée, essai avec 'published'");
      updateData = {
        published,
      };
      
      const result = await supabase
        .from("resources")
        .update(updateData)
        .eq("id", resourceId)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("[api/resources] Erreur lors de la mise à jour:", error);
      return NextResponse.json({ 
        error: "Erreur lors de la publication", 
        details: error.message 
      }, { status: 500 });
    }

    // Synchroniser avec catalog_items si Super Admin et ressource publiée (ou si contentin, toujours)
    if (data && data.id && (published || true)) { // Toujours synchroniser pour contentin
      try {
        // Vérifier si c'est contentin.cabinet@gmail.com
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .maybeSingle();

        const isContentin = profile?.email === "contentin.cabinet@gmail.com";

        await syncCatalogItem({
          supabase,
          userId: user.id,
          contentId: data.id,
          itemType: "ressource",
          title: data.title || "",
          description: data.description || null,
          shortDescription: data.description ? data.description.substring(0, 150) : null,
          price: (data as any).price || 0,
          category: (data as any).category || null,
              heroImage: cover_image_url || (data as any).hero_image_url || (data as any).cover_image_url || (data as any).cover_url || null,
              thumbnailUrl: cover_image_url || (data as any).thumbnail_url || (data as any).cover_image_url || (data as any).cover_url || null,
          targetAudience: isContentin ? "apprenant" : "apprenant",
          assignmentType: isContentin ? "no_school" : "no_school",
          status: published ? "published" : "draft",
        });
      } catch (syncError) {
        console.error("[api/resources] Erreur lors de la synchronisation avec catalog_items:", syncError);
        // Ne pas bloquer la mise à jour si la synchronisation échoue
      }
    }

    return NextResponse.json({ 
      success: true, 
      resource: data,
      message: published ? "Ressource publiée avec succès" : "Ressource retirée de la publication"
    });
  } catch (error) {
    console.error("[api/resources] Erreur inattendue:", error);
    console.error("[api/resources] Stack trace:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

