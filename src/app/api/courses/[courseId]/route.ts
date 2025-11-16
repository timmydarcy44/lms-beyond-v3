import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { CourseBuilderSnapshot } from "@/types/course-builder";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
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

    const { courseId } = await params;
    const body = await request.json();
    const { snapshot, status = "draft" } = body as {
      snapshot: CourseBuilderSnapshot;
      status?: "draft" | "published";
    };

    console.log("[api/courses/[courseId]] Mise à jour du course:", {
      courseId,
      hasSnapshot: !!snapshot,
      title: snapshot?.general?.title,
      status,
    });

    if (!snapshot || !snapshot.general?.title) {
      return NextResponse.json({ error: "Titre de formation requis" }, { status: 400 });
    }

    // Vérifier que le course existe et que l'utilisateur est propriétaire/créateur
    const { data: existingCourse, error: checkError } = await supabase
      .from("courses")
      .select("creator_id, owner_id")
      .eq("id", courseId)
      .single();

    if (checkError || !existingCourse) {
      console.error("[api/courses/[courseId]] Course introuvable:", {
        courseId,
        error: checkError,
      });
      return NextResponse.json({ 
        error: "Course introuvable pour la mise à jour",
        details: "Le courseId fourni n'existe pas dans la base de données"
      }, { status: 404 });
    }

    const isOwner = existingCourse.creator_id === user.id || 
                   (existingCourse.owner_id && existingCourse.owner_id === user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à modifier cette formation" }, { status: 403 });
    }

    // Préparer les données pour la mise à jour
    const courseData: any = {
      title: snapshot.general.title,
      description: snapshot.general.subtitle || null,
      status,
      builder_snapshot: snapshot,
      cover_image: snapshot.general.heroImage || null,
      updated_at: new Date().toISOString(),
      price: snapshot.general.price || 0, // Inclure le prix depuis le snapshot
    };

    console.log("[api/courses/[courseId]] Données de mise à jour:", {
      courseId,
      courseData: Object.keys(courseData),
      title: courseData.title,
      price: courseData.price,
    });

    const { data, error } = await supabase
      .from("courses")
      .update(courseData)
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      console.error("[api/courses/[courseId]] Erreur lors de la mise à jour:", error);
      console.error("[api/courses/[courseId]] Détails de l'erreur:", {
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

    console.log("[api/courses/[courseId]] Course mis à jour avec succès:", {
      id: data?.id,
      title: data?.title,
      price: data?.price,
    });

    // Synchroniser avec catalog_items si le module est publié
    if (status === "published") {
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
            .eq("content_id", courseId)
            .eq("item_type", "module")
            .maybeSingle();

          const catalogItemData: any = {
            content_id: courseId,
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
              console.error("[api/courses/[courseId]] Erreur lors de la mise à jour du catalog_item:", updateError);
            } else {
              console.log("[api/courses/[courseId]] ✅ Catalog item mis à jour:", existingCatalogItem.id);
            }
          } else {
            // Créer un nouvel item
            const { error: insertError } = await supabase
              .from("catalog_items")
              .insert(catalogItemData);

            if (insertError) {
              console.error("[api/courses/[courseId]] Erreur lors de la création du catalog_item:", insertError);
            } else {
              console.log("[api/courses/[courseId]] ✅ Catalog item créé pour le module");
            }
          }
        }
      } catch (catalogError) {
        console.error("[api/courses/[courseId]] Erreur lors de la synchronisation avec catalog_items:", catalogError);
        // Ne pas bloquer la réponse si la synchronisation échoue
      }
    }

    return NextResponse.json({ 
      success: true, 
      course: data,
      message: status === "published" ? "Formation publiée avec succès" : "Formation sauvegardée en brouillon"
    });
  } catch (error) {
    console.error("[api/courses/[courseId]] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
