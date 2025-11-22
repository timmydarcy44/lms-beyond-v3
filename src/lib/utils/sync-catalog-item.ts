/**
 * Fonction helper pour synchroniser un contenu avec catalog_items
 * Utilisée pour les courses, resources, tests, etc.
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface SyncCatalogItemParams {
  supabase: SupabaseClient;
  userId: string;
  contentId: string;
  itemType: "module" | "ressource" | "test" | "parcours";
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  price?: number | null;
  category?: string | null;
  heroImage?: string | null;
  thumbnailUrl?: string | null;
  targetAudience?: "pro" | "apprenant" | "all";
  isActive?: boolean;
  assignmentType?: "no_school" | "organization";
  status?: "draft" | "published";
}

/**
 * Synchronise un contenu avec catalog_items
 * Crée ou met à jour le catalog_item selon les conditions
 */
export async function syncCatalogItem(params: SyncCatalogItemParams): Promise<{
  success: boolean;
  created: boolean;
  updated: boolean;
  catalogItemId?: string;
  error?: string;
}> {
  const {
    supabase,
    userId,
    contentId,
    itemType,
    title,
    description,
    shortDescription,
    price = 0,
    category,
    heroImage,
    thumbnailUrl,
    targetAudience = "all",
    isActive,
    assignmentType = "no_school",
    status = "draft",
  } = params;

  try {
    // Vérifier si l'utilisateur est un Super Admin
    const { data: superAdminCheck } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!superAdminCheck) {
      // Pas un Super Admin, ne pas synchroniser
      return { success: false, created: false, updated: false, error: "Not a super admin" };
    }

    // Vérifier si c'est contentin.cabinet@gmail.com
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    const isContentin = profile?.email === "contentin.cabinet@gmail.com";

    // Pour contentin.cabinet@gmail.com, forcer les paramètres pour les ressources Jessica Contentin
    let finalAssignmentType = assignmentType;
    let finalTargetAudience = targetAudience;
    let finalIsActive = isActive;

    if (isContentin) {
      // Pour contentin, tout doit être dans les ressources Jessica Contentin
      finalAssignmentType = "no_school"; // Utiliser "no_school" mais avec des paramètres spécifiques
      finalTargetAudience = "apprenant"; // Toujours "apprenant" pour apparaître dans les ressources
      finalIsActive = true; // Toujours actif pour apparaître immédiatement
      console.log(`[sync-catalog-item] 🎯 Contentin détecté - Forçage des paramètres pour ressources Jessica Contentin`);
    } else {
      // Pour les autres super admins, logique normale
      finalTargetAudience = assignmentType === "no_school" 
        ? "apprenant" 
        : (targetAudience || "all");
    }

    // Si No School ou Contentin, toujours ajouter au catalogue et activer
    // Si Organisation, ajouter au catalogue seulement si publié
    const shouldAddToCatalog = (finalAssignmentType === "no_school" || isContentin)
      ? true 
      : (status === "published" || finalTargetAudience === "apprenant");

    if (!shouldAddToCatalog) {
      return { success: true, created: false, updated: false, error: "Should not be in catalog" };
    }

    // Déterminer is_active
    if (isContentin) {
      finalIsActive = true; // Toujours actif pour contentin
    } else {
      finalIsActive = isActive !== undefined 
        ? isActive 
        : (finalAssignmentType === "no_school" || status === "published");
    }

    // Vérifier si un catalog_item existe déjà
    const { data: existingCatalogItems } = await supabase
      .from("catalog_items")
      .select("id")
      .eq("content_id", contentId)
      .eq("item_type", itemType)
      .eq("creator_id", userId) // Filtrer par creator_id pour éviter les doublons
      .order("created_at", { ascending: false });

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
      console.log(`[sync-catalog-item] 🗑️ Supprimé ${idsToDelete.length} catalog_item(s) en double pour ${itemType} ${contentId}`);
    }

    const catalogItemData: any = {
      content_id: contentId,
      item_type: itemType,
      title,
      description: description || null,
      short_description: shortDescription || (description ? description.substring(0, 150) : null) || null,
      price: price || 0,
      is_free: !price || price === 0,
      category: category || null,
      hero_image_url: heroImage || null,
      thumbnail_url: thumbnailUrl || heroImage || null,
      target_audience: finalTargetAudience,
      creator_id: userId,
      is_active: finalIsActive, // Toujours true pour contentin
      updated_at: new Date().toISOString(),
    };

    if (existingCatalogItem) {
      // Mettre à jour l'item existant
      const { error: updateError } = await supabase
        .from("catalog_items")
        .update(catalogItemData)
        .eq("id", existingCatalogItem.id);

      if (updateError) {
        console.error(`[sync-catalog-item] ❌ Erreur lors de la mise à jour du catalog_item pour ${itemType}:`, updateError);
        return { success: false, created: false, updated: false, error: updateError.message };
      }

      console.log(`[sync-catalog-item] ✅ Catalog item mis à jour pour ${itemType}:`, existingCatalogItem.id);
      return { success: true, created: false, updated: true, catalogItemId: existingCatalogItem.id };
    } else {
      // Créer un nouvel item
      catalogItemData.created_by = userId; // Ajouter created_by (NOT NULL)
      catalogItemData.created_at = new Date().toISOString();

      const { data: insertedItem, error: insertError } = await supabase
        .from("catalog_items")
        .insert(catalogItemData)
        .select("id")
        .single();

      if (insertError) {
        console.error(`[sync-catalog-item] ❌ Erreur lors de la création du catalog_item pour ${itemType}:`, insertError);
        return { success: false, created: false, updated: false, error: insertError.message };
      }

      console.log(`[sync-catalog-item] ✅ Catalog item créé pour ${itemType}:`, insertedItem.id);
      return { success: true, created: true, updated: false, catalogItemId: insertedItem.id };
    }
  } catch (error) {
    console.error(`[sync-catalog-item] ❌ Erreur inattendue lors de la synchronisation pour ${itemType}:`, error);
    return { 
      success: false, 
      created: false, 
      updated: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
}

