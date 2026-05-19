import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { CourseBuilderSnapshot } from "@/types/course-builder";
import { createStripeProduct, updateStripeProduct } from "@/lib/stripe/products";
import { syncBadgeToDatabase } from "@/lib/badges/sync-badge-from-snapshot";
import { resolveOrgIdFromCourseSnapshot } from "@/lib/utils/course-org-id";

export async function POST(request: NextRequest) {
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

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
    console.log("RECU SUR LE SERVEUR:", body);
    const { snapshot, status = "draft", courseId } = body as {
      snapshot: CourseBuilderSnapshot;
      status?: "draft" | "published";
      courseId?: string;
    };
    const orgIdRaw = String((body as any)?.org_id ?? (body as any)?.orgId ?? (body as any)?.orgID ?? "").trim();
    const orgIdFromBody = orgIdRaw && isUuid(orgIdRaw) ? orgIdRaw : null;

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

    if (courseId && !isUuid(String(courseId))) {
      return NextResponse.json({ error: "Invalid courseId", details: "courseId must be a UUID" }, { status: 400 });
    }
    
    // IMPORTANT: Vérifier si un course avec le même titre existe déjà (pour éviter les doublons)
    // Si courseId n'est pas fourni, chercher un course existant avec le même titre et le même créateur
    let courseIdToUse = courseId;
    
    if (!courseIdToUse) {
      console.log("[api/courses] Aucun courseId fourni, recherche d'un course existant avec le même titre...");
      const { data: existingCourseByTitle, error: searchError } = await supabase
        .from("courses")
        .select("id, title, creator_id, owner_id")
        .eq("title", snapshot.general.title.trim())
        .eq("creator_id", user.id)
        .maybeSingle();
      
      if (searchError) {
        console.error("[api/courses] Erreur lors de la recherche d'un course existant:", searchError);
      } else if (existingCourseByTitle) {
        console.log("[api/courses] ⚠️ Course existant trouvé avec le même titre, utilisation pour mise à jour:", {
          id: existingCourseByTitle.id,
          title: existingCourseByTitle.title,
          creator_id: existingCourseByTitle.creator_id,
        });
        courseIdToUse = existingCourseByTitle.id;
      } else {
        console.log("[api/courses] Aucun course existant trouvé, création d'un nouveau course");
      }
    }
    
    // Validation importante : si courseId est fourni (ou trouvé), vérifier qu'il existe
    if (courseIdToUse) {
      const { data: existingCourse, error: checkError } = await supabase
        .from("courses")
        .select("id, title, creator_id, owner_id")
        .eq("id", courseIdToUse)
        .maybeSingle();
      
      if (checkError || !existingCourse) {
        console.error("[api/courses] CourseId fourni mais course introuvable:", {
          courseId: courseIdToUse,
          error: checkError,
        });
        return NextResponse.json({ 
          error: "Course introuvable pour la mise à jour",
          details: "Le courseId fourni n'existe pas dans la base de données"
        }, { status: 404 });
      }
      
      // Vérifier que l'utilisateur est le créateur/propriétaire
      if (existingCourse.creator_id !== user.id && existingCourse.owner_id !== user.id) {
        console.error("[api/courses] Utilisateur non autorisé à modifier ce course:", {
          courseId: courseIdToUse,
          courseCreatorId: existingCourse.creator_id,
          userId: user.id,
        });
        return NextResponse.json({ 
          error: "Vous n'êtes pas autorisé à modifier cette formation",
        }, { status: 403 });
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
    const finalSlug = courseIdToUse ? undefined : `${slug || 'course'}-${Date.now()}`;
    
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
      cover_image: snapshot.general.cover_image || snapshot.general.heroImage || null,
      image_url: snapshot.general.cover_image || null,
      updated_at: new Date().toISOString(),
      price: snapshot.general.price || 0, // Inclure le prix depuis le snapshot
      category: snapshot.general.category || null, // Inclure la catégorie depuis le snapshot
      org_id: orgIdFromBody ?? resolveOrgIdFromCourseSnapshot(snapshot),
    };

    // Ne pas modifier creator_id lors d'une mise à jour (pour éviter les problèmes de propriété)
    if (!courseIdToUse) {
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
    if (courseIdToUse) {
      // Mise à jour d'une formation existante
      // (La vérification a déjà été faite plus haut)
      const { data: existingCourse, error: checkError } = await supabase
        .from("courses")
        .select("creator_id, owner_id, id")
        .eq("id", courseIdToUse)
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

      console.log("[api/courses] Mise à jour du course:", JSON.stringify({
        courseId: courseIdToUse,
        existingCourseId: existingCourse?.id,
        courseData: Object.keys(courseData),
        title: courseData.title,
        status,
      }));

      const { data, error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", courseIdToUse)
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

    // CLEANUP: on ne synchronise plus avec `catalog_items` ici.
    // Cette API doit gérer uniquement la table `courses`.

    if (result?.id && snapshot) {
      const sync = await syncBadgeToDatabase(supabase, String(result.id), snapshot);
      if (!sync.ok) {
        console.warn("[api/courses] syncBadgeToDatabase:", sync.error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      course: result,
      message: status === "published" ? "Formation publiée avec succès" : "Formation sauvegardée en brouillon"
    });
  } catch (err) {
    console.error("DETAILED SERVER ERROR:", err);
    console.error("[api/courses] Erreur inattendue:", {
      message: (err as any)?.message,
      stack: (err as any)?.stack,
      raw: err,
    });
    return NextResponse.json(
      { error: "Erreur serveur", details: (err as any)?.message ?? String(err) },
      { status: 500 },
    );
  }
}

