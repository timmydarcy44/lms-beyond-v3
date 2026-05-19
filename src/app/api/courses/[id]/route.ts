import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { CourseBuilderSnapshot } from "@/types/course-builder";
import { syncBadgeToDatabase } from "@/lib/badges/sync-badge-from-snapshot";
import { resolveOrgIdFromCourseSnapshot } from "@/lib/utils/course-org-id";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const { snapshot, status = "draft" } = body as {
      snapshot: CourseBuilderSnapshot;
      status?: "draft" | "published";
    };

    console.log("[api/courses/[id]] Mise à jour du course:", {
      id,
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
      .eq("id", id)
      .single();

    if (checkError || !existingCourse) {
      console.error("[api/courses/[id]] Course introuvable:", {
        id,
        error: checkError,
      });
      return NextResponse.json({ 
        error: "Course introuvable pour la mise à jour",
        details: "L'identifiant fourni n'existe pas dans la base de données"
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
      cover_image: snapshot.general.cover_image || snapshot.general.heroImage || null,
      image_url: snapshot.general.cover_image || snapshot.general.thumbnail || snapshot.general.heroImage || null,
      updated_at: new Date().toISOString(),
      price: snapshot.general.price || 0, // Inclure le prix depuis le snapshot
      org_id: resolveOrgIdFromCourseSnapshot(snapshot),
    };

    console.log("[api/courses/[id]] Données de mise à jour:", {
      id,
      courseData: Object.keys(courseData),
      title: courseData.title,
      price: courseData.price,
    });

    const { data, error } = await supabase
      .from("courses")
      .update(courseData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[api/courses/[id]] Erreur lors de la mise à jour:", error);
      console.error("[api/courses/[id]] Détails de l'erreur:", {
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

    console.log("[api/courses/[id]] Course mis à jour avec succès:", {
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
          const assignmentType = snapshot.general.assignment_type || "no_school";
          const assignedOrgId = snapshot.general.assigned_organization_id;
          
          // Si assignment_type === "no_school", forcer target_audience à "apprenant" et publication automatique
          const targetAudience = assignmentType === "no_school" 
            ? "apprenant" 
            : (snapshot.general.target_audience || "all");
          
          // Si No School, toujours ajouter au catalogue et activer
          // Si Organisation, ajouter au catalogue seulement si publié
          const shouldAddToCatalog = assignmentType === "no_school" 
            ? true 
            : (status === "published" || targetAudience === "apprenant");
          
          console.log("[api/courses/[id]] Super Admin detected, assignment_type:", assignmentType, "target_audience:", targetAudience, "status:", status, "shouldAddToCatalog:", shouldAddToCatalog);

          if (shouldAddToCatalog) {
            // Vérifier si un catalog_item existe déjà pour ce course
            // Filtrer aussi par creator_id pour éviter les doublons
            const { data: existingCatalogItems } = await supabase
              .from("catalog_items")
              .select("id")
              .eq("content_id", id)
              .eq("item_type", "module")
              .eq("creator_id", user.id) // Filtrer par creator_id pour éviter les doublons
              .order("created_at", { ascending: false }); // Prendre le plus récent
            
            // Prendre le premier (le plus récent) s'il y en a plusieurs
            const existingCatalogItem = existingCatalogItems && existingCatalogItems.length > 0 
              ? existingCatalogItems[0] 
              : null;
            
            // Si plusieurs items existent, supprimer les anciens (garder seulement le plus récent)
            if (existingCatalogItems && existingCatalogItems.length > 1) {
              const idsToDelete = existingCatalogItems.slice(1).map(item => item.id);
              await supabase
                .from("catalog_items")
                .delete()
                .in("id", idsToDelete);
              console.log(`[api/courses/[id]] 🗑️ Supprimé ${idsToDelete.length} catalog_item(s) en double pour le module ${id}`);
            }

            const catalogItemData: any = {
              content_id: id,
              item_type: "module",
              title: snapshot.general.title,
              description: snapshot.general.subtitle || null,
              short_description: snapshot.general.subtitle || null,
              price: snapshot.general.price || 0,
              is_free: !snapshot.general.price || snapshot.general.price === 0,
              category: snapshot.general.category || null,
              hero_image_url: snapshot.general.heroImage || null,
              thumbnail_url: snapshot.general.heroImage || null,
              target_audience: targetAudience,
              creator_id: user.id,
              created_by: user.id, // IMPORTANT: Champ requis NOT NULL
              // Actif si No School (publication automatique) OU si publié
              is_active: assignmentType === "no_school" || status === "published",
              updated_at: new Date().toISOString(),
            };

            if (existingCatalogItem) {
              // Mettre à jour l'item existant
              catalogItemData.created_by = user.id; // S'assurer que created_by est défini
              const { error: updateError } = await supabase
                .from("catalog_items")
                .update(catalogItemData)
                .eq("id", existingCatalogItem.id);

              if (updateError) {
                console.error("[api/courses/[id]] ❌ Erreur lors de la mise à jour du catalog_item:", updateError);
              } else {
                console.log("[api/courses/[id]] ✅ Catalog item mis à jour:", existingCatalogItem.id, "target_audience:", targetAudience, "is_active:", catalogItemData.is_active);
              }
            } else {
              // Créer un nouvel item
              catalogItemData.created_by = user.id; // Ajouter created_by (NOT NULL)
              catalogItemData.created_at = new Date().toISOString();
              const { error: insertError } = await supabase
                .from("catalog_items")
                .insert(catalogItemData);

              if (insertError) {
                console.error("[api/courses/[id]] ❌ Erreur lors de la création du catalog_item:", insertError);
              } else {
                console.log("[api/courses/[id]] ✅ Catalog item créé pour le module:", id, "assignment_type:", assignmentType, "target_audience:", targetAudience, "is_active:", catalogItemData.is_active);
              }
            }
          }
        }
      } catch (catalogError) {
        console.error("[api/courses/[id]] Erreur lors de la synchronisation avec catalog_items:", catalogError);
        // Ne pas bloquer la réponse si la synchronisation échoue
      }
    }

    if (data?.id && snapshot) {
      const sync = await syncBadgeToDatabase(supabase, String(data.id), snapshot);
      if (!sync.ok) {
        console.warn("[api/courses/[id]] syncBadgeToDatabase:", sync.error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      course: data,
      message: status === "published" ? "Formation publiée avec succès" : "Formation sauvegardée en brouillon"
    });
  } catch (error) {
    console.error("[api/courses/[id]] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
