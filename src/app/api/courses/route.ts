import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { CourseBuilderSnapshot } from "@/types/course-builder";
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
    const { snapshot, status = "draft", courseId } = body as {
      snapshot: CourseBuilderSnapshot;
      status?: "draft" | "published";
      courseId?: string;
    };

    console.log("[api/courses] Requête reçue:", {
      hasSnapshot: !!snapshot,
      title: snapshot?.general?.title,
      courseId,
      status,
      isUpdate: !!courseId,
    });

    if (!snapshot || !snapshot.general?.title) {
      return NextResponse.json({ error: "Titre de formation requis" }, { status: 400 });
    }
    
    // Validation importante : si courseId est fourni, vérifier qu'il existe
    if (courseId) {
      const { data: existingCourse, error: checkError } = await supabase
        .from("courses")
        .select("id, title, creator_id, owner_id")
        .eq("id", courseId)
        .maybeSingle();
      
      if (checkError || !existingCourse) {
        console.error("[api/courses] CourseId fourni mais course introuvable:", {
          courseId,
          error: checkError,
        });
        return NextResponse.json({ 
          error: "Course introuvable pour la mise à jour",
          details: "Le courseId fourni n'existe pas dans la base de données"
        }, { status: 404 });
      }
      
      console.log("[api/courses] Course existant trouvé:", {
        id: existingCourse.id,
        title: existingCourse.title,
        creator_id: existingCourse.creator_id,
        owner_id: existingCourse.owner_id,
      });
    }

    // Générer un slug à partir du titre
    const slug = snapshot.general.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Générer le slug final
    const finalSlug = courseId ? undefined : `${slug || 'course'}-${Date.now()}`;
    
    // Vérifier d'abord si la colonne owner_id existe dans la table
    // (certaines structures utilisent owner_id au lieu de creator_id)
    const { data: tableInfo } = await supabase
      .from("courses")
      .select("id")
      .limit(0);
    
    // Préparer les données pour la table courses
    const courseData: any = {
      title: snapshot.general.title,
      description: snapshot.general.subtitle || null,
      status,
      builder_snapshot: snapshot,
      cover_image: snapshot.general.heroImage || null,
      updated_at: new Date().toISOString(),
      price: snapshot.general.price || 0, // Inclure le prix depuis le snapshot
      category: snapshot.general.category || null, // Inclure la catégorie depuis le snapshot
    };

    // Ne pas modifier creator_id lors d'une mise à jour (pour éviter les problèmes de propriété)
    if (!courseId) {
      // Création : définir creator_id et owner_id
      courseData.creator_id = user.id;
      courseData.owner_id = user.id;
      // Ajouter slug seulement si création
      if (finalSlug) {
        courseData.slug = finalSlug;
      }
    } else {
      // Mise à jour : ne pas modifier creator_id, seulement owner_id si nécessaire
      // Ne pas ajouter creator_id pour éviter de changer le créateur original
      // owner_id peut être mis à jour si nécessaire (mais on le laisse tel quel généralement)
    }

    let result;
    if (courseId) {
      // Mise à jour d'une formation existante
      // Vérifier d'abord que l'utilisateur est propriétaire/créateur
      const { data: existingCourse, error: checkError } = await supabase
        .from("courses")
        .select("creator_id, owner_id")
        .eq("id", courseId)
        .single();

      if (checkError) {
        console.error("[api/courses] Erreur lors de la vérification:", checkError);
        return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
      }

      if (existingCourse) {
        const isOwner = existingCourse.creator_id === user.id || 
                       (existingCourse.owner_id && existingCourse.owner_id === user.id);
        if (!isOwner) {
          return NextResponse.json({ error: "Vous n'êtes pas autorisé à modifier cette formation" }, { status: 403 });
        }
      }

      console.log("[api/courses] Mise à jour du course:", {
        courseId,
        courseData: Object.keys(courseData),
        title: courseData.title,
      });

      const { data, error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", courseId)
        .select()
        .single();

      if (error) {
        console.error("[api/courses] Erreur lors de la mise à jour:", error);
        console.error("[api/courses] Détails de l'erreur:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return NextResponse.json({ 
          error: "Erreur lors de la sauvegarde",
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      console.log("[api/courses] Course mis à jour avec succès:", {
        id: data?.id,
        title: data?.title,
      });
      
      result = data;
    } else {
      // Création d'une nouvelle formation
      // Note: Si des triggers tentent de créer des sections automatiquement,
      // ils seront désactivés via le script SQL FIX_SECTIONS_FORMATION_ID.sql
      const { data, error } = await supabase
        .from("courses")
        .insert(courseData)
        .select()
        .single();

      if (error) {
        console.error("[api/courses] Erreur lors de la création:", error);
        console.error("[api/courses] Détails:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // Si le slug existe déjà, générer un nouveau
        if (error.code === "23505") {
          const newSlug = `${slug}-${Date.now()}`;
          courseData.slug = newSlug;
          const { data: retryData, error: retryError } = await supabase
            .from("courses")
            .insert(courseData)
            .select()
            .single();
          
          if (retryError) {
            console.error("[api/courses] Erreur lors de la retry:", retryError);
            return NextResponse.json({ 
              error: "Erreur lors de la création", 
              details: retryError.message,
              code: retryError.code
            }, { status: 500 });
          }
          result = retryData;
        } else {
          // Erreur plus détaillée
          const errorMessage = error.message || "Erreur lors de la création";
          return NextResponse.json({ 
            error: errorMessage,
            details: error.details,
            hint: error.hint,
            code: error.code
          }, { status: 500 });
        }
      } else {
        result = data;
      }
    }

    // Créer automatiquement un produit Stripe si un prix > 0 est défini
    if (result && result.id) {
      const coursePrice = snapshot.general.price || courseData.price || 0;
      if (coursePrice > 0) {
        try {
          // Vérifier si un produit Stripe existe déjà
          const existingStripeProductId = result.stripe_product_id;
          
          if (existingStripeProductId) {
            // Mettre à jour le produit Stripe existant
            const updatedStripe = await updateStripeProduct(existingStripeProductId, {
              title: snapshot.general.title,
              description: snapshot.general.subtitle || undefined,
              price: coursePrice,
              metadata: {
                course_id: result.id,
                creator_id: user.id,
              },
            });

            if (updatedStripe) {
              await supabase
                .from("courses")
                .update({
                  stripe_product_id: updatedStripe.productId,
                  stripe_price_id: updatedStripe.priceId || result.stripe_price_id,
                })
                .eq("id", result.id);
            }
          } else {
            // Créer un nouveau produit Stripe
            const stripeProduct = await createStripeProduct({
              title: snapshot.general.title,
              description: snapshot.general.subtitle || undefined,
              price: coursePrice,
              contentType: "module",
              contentId: result.id,
              userId: user.id,
              metadata: {
                course_id: result.id,
                creator_id: user.id,
              },
            });

            if (stripeProduct) {
              await supabase
                .from("courses")
                .update({
                  stripe_product_id: stripeProduct.productId,
                  stripe_price_id: stripeProduct.priceId,
                })
                .eq("id", result.id);
            }
          }
        } catch (stripeError) {
          console.error("[api/courses] Erreur Stripe:", stripeError);
          // Ne pas bloquer la création/mise à jour si Stripe échoue
        }
      }
    }

    // Synchroniser avec catalog_items si le module est publié et que l'utilisateur est un Super Admin
    if (status === "published" && result?.id) {
      try {
        // Vérifier si l'utilisateur est un Super Admin
        const { data: superAdminCheck } = await supabase
          .from("super_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (superAdminCheck) {
          // Vérifier si un catalog_item existe déjà pour ce course
          const { data: existingCatalogItem } = await supabase
            .from("catalog_items")
            .select("id")
            .eq("content_id", result.id)
            .eq("item_type", "module")
            .maybeSingle();

          const catalogItemData: any = {
            content_id: result.id,
            item_type: "module",
            title: snapshot.general.title,
            description: snapshot.general.subtitle || null,
            short_description: snapshot.general.subtitle || null,
            price: snapshot.general.price || 0,
            is_free: !snapshot.general.price || snapshot.general.price === 0,
            category: snapshot.general.category || null,
            hero_image_url: snapshot.general.heroImage || null,
            thumbnail_url: snapshot.general.heroImage || null,
            target_audience: snapshot.general.target_audience || "all",
            creator_id: user.id,
            is_active: true,
            updated_at: new Date().toISOString(),
          };

          if (existingCatalogItem) {
            // Mettre à jour l'item existant
            const { error: updateError } = await supabase
              .from("catalog_items")
              .update(catalogItemData)
              .eq("id", existingCatalogItem.id);

            if (updateError) {
              console.error("[api/courses] Erreur lors de la mise à jour du catalog_item:", updateError);
            } else {
              console.log("[api/courses] ✅ Catalog item mis à jour:", existingCatalogItem.id);
            }
          } else {
            // Créer un nouvel item
            const { error: insertError } = await supabase
              .from("catalog_items")
              .insert(catalogItemData);

            if (insertError) {
              console.error("[api/courses] Erreur lors de la création du catalog_item:", insertError);
            } else {
              console.log("[api/courses] ✅ Catalog item créé pour le module");
            }
          }
        }
      } catch (catalogError) {
        console.error("[api/courses] Erreur lors de la synchronisation avec catalog_items:", catalogError);
        // Ne pas bloquer la réponse si la synchronisation échoue
      }
    }

    return NextResponse.json({ 
      success: true, 
      course: result,
      message: status === "published" ? "Formation publiée avec succès" : "Formation sauvegardée en brouillon"
    });
  } catch (error) {
    console.error("[api/courses] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

