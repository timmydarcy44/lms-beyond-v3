import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/auth/super-admin";
import { createStripeProduct, updateStripeProduct } from "@/lib/stripe/products";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      status = "draft", 
      pathId,
      selectedCourses = [],
      selectedTests = [],
      selectedResources = [],
      builderSnapshot,
      price,
      orgId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Titre de parcours requis" }, { status: 400 });
    }

    // Générer un slug à partir du titre
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const finalSlug = pathId ? undefined : `${slug || 'path'}-${Date.now()}`;

    const isSuperAdminUser = await isUserSuperAdmin(user.id);
    const db = isSuperAdminUser ? await getServiceRoleClientOrFallback() : supabase;

    if (!db) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Préparer les données pour la table paths
    const pathData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      status,
      // Ne pas inclure updated_at si la colonne n'existe pas
      // updated_at sera géré automatiquement par un trigger si présent
    };

    // Ajouter prix si fourni (on essaiera, mais si la colonne n'existe pas, on l'ignorera)
    if (price !== undefined && price !== null) {
      pathData.price = parseFloat(String(price)) || 0;
    }
    
    // Essayer d'ajouter updated_at seulement si la colonne existe
    // (certaines structures utilisent un trigger pour mettre à jour updated_at automatiquement)

    // Ajouter builder_snapshot si fourni
    if (builderSnapshot) {
      pathData.builder_snapshot = builderSnapshot;
    }

    if (orgId) {
      pathData.org_id = orgId;
    }

    // Utiliser owner_id si la colonne existe, sinon creator_id
    // Vérifier si owner_id existe dans la table
    const { data: existingPath } = pathId 
      ? await db.from("paths").select("id, owner_id, creator_id").eq("id", pathId).single()
      : { data: null };

    if (pathId && !existingPath) {
      return NextResponse.json({ error: "Parcours non trouvé" }, { status: 404 });
    }

    // Si c'est une création, ajouter creator_id et owner_id
    if (!pathId) {
      pathData.creator_id = user.id;
      pathData.owner_id = user.id;
      if (finalSlug) {
        pathData.slug = finalSlug;
      }
    } else {
      // Pour la mise à jour, on garde creator_id et owner_id existants
      // existingPath est vérifié non-null ci-dessus si pathId existe
      pathData.owner_id = existingPath?.owner_id || user.id;
    }

    let result;
    
    if (pathId) {
      // Mise à jour
      // Ne pas inclure updated_at dans l'update - laisser le trigger le gérer si présent
      const { data, error } = await db
        .from("paths")
        .update(pathData)
        .eq("id", pathId)
        .select()
        .single();

      if (error) {
        // Si l'erreur est liée à la colonne price, retirer price et réessayer
        if (error.message?.includes("price") && error.code === "42703") {
          console.log("[api/paths] Colonne price non trouvée, retrait du prix");
          const pathDataWithoutPrice = { ...pathData };
          delete pathDataWithoutPrice.price;
          
          const retryResult = await db
            .from("paths")
            .update(pathDataWithoutPrice)
            .eq("id", pathId)
            .select()
            .single();
          
          if (!retryResult.error) {
            result = { data: retryResult.data, error: null };
          } else {
            console.error("[api/paths] Erreur lors de la mise à jour (après retrait du prix):", retryResult.error);
            return NextResponse.json({ 
              error: "Erreur lors de la mise à jour", 
              details: retryResult.error.message,
              hint: retryResult.error.hint 
            }, { status: 500 });
          }
        } else {
          console.error("[api/paths] Erreur lors de la mise à jour:", error);
          return NextResponse.json({ 
            error: "Erreur lors de la mise à jour", 
            details: error.message,
            hint: error.hint 
          }, { status: 500 });
        }
      }

      result = data;
    } else {
      // Création
      const { data, error } = await db
        .from("paths")
        .insert(pathData)
        .select()
        .single();

      if (error) {
        // Si l'erreur est liée à la colonne price, retirer price et réessayer
        if (error.message?.includes("price") && error.code === "42703") {
          console.log("[api/paths] Colonne price non trouvée, retrait du prix");
          const pathDataWithoutPrice = { ...pathData };
          delete pathDataWithoutPrice.price;
          
          const retryResult = await db
            .from("paths")
            .insert(pathDataWithoutPrice)
            .select()
            .single();
          
          if (!retryResult.error) {
            result = { data: retryResult.data, error: null };
          } else {
            console.error("[api/paths] Erreur lors de la création (après retrait du prix):", retryResult.error);
            return NextResponse.json({ 
              error: "Erreur lors de la création", 
              details: retryResult.error.message,
              hint: retryResult.error.hint 
            }, { status: 500 });
          }
        } else {
          console.error("[api/paths] Erreur lors de la création:", error);
          return NextResponse.json({ 
            error: "Erreur lors de la création", 
            details: error.message,
            hint: error.hint 
          }, { status: 500 });
        }
      }

      result = data;
    }

    const savedPathId = result.id;

    // Créer automatiquement un produit Stripe si un prix > 0 est défini
    if (result && result.id) {
      const pathPrice = price !== undefined && price !== null ? parseFloat(String(price)) : 0;
      if (pathPrice > 0) {
        try {
          // Vérifier si un produit Stripe existe déjà
          const existingStripeProductId = result.stripe_product_id;
          
          if (existingStripeProductId) {
            // Mettre à jour le produit Stripe existant
            const updatedStripe = await updateStripeProduct(existingStripeProductId, {
              title: title.trim(),
              description: description?.trim() || undefined,
              price: pathPrice,
              metadata: {
                path_id: result.id,
                creator_id: user.id,
              },
            });

            if (updatedStripe) {
              await db
                .from("paths")
                .update({
                  stripe_product_id: updatedStripe.productId,
                  stripe_price_id: updatedStripe.priceId || result.stripe_price_id,
                })
                .eq("id", result.id);
            }
          } else {
            // Créer un nouveau produit Stripe
            const stripeProduct = await createStripeProduct({
              title: title.trim(),
              description: description?.trim() || undefined,
              price: pathPrice,
              contentType: "parcours",
              contentId: result.id,
              userId: user.id,
              metadata: {
                path_id: result.id,
                creator_id: user.id,
              },
            });

            if (stripeProduct) {
              await db
                .from("paths")
                .update({
                  stripe_product_id: stripeProduct.productId,
                  stripe_price_id: stripeProduct.priceId,
                })
                .eq("id", result.id);
            }
          }
        } catch (stripeError) {
          console.error("[api/paths] Erreur Stripe:", stripeError);
          // Ne pas bloquer la création/mise à jour si Stripe échoue
        }
      }
    }

    // Sauvegarder les relations avec les cours
    if (selectedCourses.length > 0) {
      // Supprimer les anciennes relations
      await db
        .from("path_courses")
        .delete()
        .eq("path_id", savedPathId);

      // Insérer les nouvelles relations
      const courseRelations = selectedCourses.map((courseId: string, index: number) => ({
        path_id: savedPathId,
        course_id: courseId,
        order: index,
      }));

      const { error: coursesError } = await db
        .from("path_courses")
        .insert(courseRelations);

      if (coursesError) {
        console.error("[api/paths] Erreur lors de l'ajout des cours:", coursesError);
        // On continue quand même, on ne bloque pas la sauvegarde du path
      }
    }

    // Sauvegarder les relations avec les tests
    if (selectedTests.length > 0) {
      // Supprimer les anciennes relations
      await db
        .from("path_tests")
        .delete()
        .eq("path_id", savedPathId);

      // Insérer les nouvelles relations
      const testRelations = selectedTests.map((testId: string, index: number) => ({
        path_id: savedPathId,
        test_id: testId,
        order: index,
      }));

      const { error: testsError } = await db
        .from("path_tests")
        .insert(testRelations);

      if (testsError) {
        console.error("[api/paths] Erreur lors de l'ajout des tests:", testsError);
        // On continue quand même
      }
    }

    // Sauvegarder les relations avec les ressources
    if (selectedResources.length > 0) {
      // Supprimer les anciennes relations
      await db
        .from("path_resources")
        .delete()
        .eq("path_id", savedPathId);

      // Insérer les nouvelles relations
      const resourceRelations = selectedResources.map((resourceId: string, index: number) => ({
        path_id: savedPathId,
        resource_id: resourceId,
        order: index,
      }));

      const { error: resourcesError } = await db
        .from("path_resources")
        .insert(resourceRelations);

      if (resourcesError) {
        console.error("[api/paths] Erreur lors de l'ajout des ressources:", resourcesError);
        // On continue quand même
      }
    }

    return NextResponse.json({ 
      success: true, 
      path: result,
      message: status === "published" ? "Parcours publié avec succès" : "Parcours sauvegardé en brouillon"
    });
  } catch (error) {
    console.error("[api/paths] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

