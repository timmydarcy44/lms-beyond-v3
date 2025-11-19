"use server";

import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const PATH_TABLE = "path_courses";
const CATALOG_TABLE = "catalog_items";
const ACCESS_TABLE = "catalog_access";
const COURSES_TABLE = "courses";

async function ensureCatalogItem(supabase: any, moduleId: string) {
  const existing = await supabase
    .from(CATALOG_TABLE)
    .select("id, is_active")
    .eq("content_id", moduleId)
    .eq("item_type", "module")
    .maybeSingle();

  if (existing.data) {
    return existing.data;
  }

  const { data: course, error: courseError } = await supabase
    .from(COURSES_TABLE)
    .select("id, title, description, cover_image, creator_id")
    .eq("id", moduleId)
    .maybeSingle();

  if (courseError || !course) {
    throw new Error("Module introuvable pour la création dans le catalogue");
  }

  const { data: inserted, error: insertError } = await supabase
    .from(CATALOG_TABLE)
    .insert({
      content_id: course.id,
      item_type: "module",
      title: course.title,
      description: course.description,
      short_description: course.description,
      price: 0,
      is_free: true,
      category: null,
      hero_image_url: course.cover_image,
      thumbnail_url: course.cover_image,
      target_audience: "all",
      creator_id: course.creator_id,
      is_active: false,
    })
    .select("id, is_active")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Impossible de créer l'entrée catalogue");
  }

  return inserted;
}

async function addModuleToPath(supabase: any, moduleId: string, pathId: string) {
  const { data: existing } = await supabase
    .from(PATH_TABLE)
    .select("order")
    .eq("path_id", pathId)
    .eq("course_id", moduleId)
    .maybeSingle();

  if (existing) {
    return;
  }

  const { data: maxOrderData } = await supabase
    .from(PATH_TABLE)
    .select("order")
    .eq("path_id", pathId)
    .order("order", { ascending: false })
    .limit(1);

  const nextOrder = (maxOrderData?.[0]?.order ?? 0) + 1;

  const { error } = await supabase.from(PATH_TABLE).insert({
    path_id: pathId,
    course_id: moduleId,
    order: nextOrder,
  });

  if (error) {
    throw new Error(error.message || "Impossible d'ajouter le module au parcours");
  }
}

async function removeModuleFromPath(supabase: any, moduleId: string, pathId: string) {
  const { error } = await supabase
    .from(PATH_TABLE)
    .delete()
    .eq("path_id", pathId)
    .eq("course_id", moduleId);

  if (error) {
    throw new Error(error.message || "Impossible de retirer le module du parcours");
  }
}

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { action, moduleId } = body as {
      action: string;
      moduleId?: string;
      pathId?: string;
      organizationId?: string;
      isActive?: boolean;
    };

    if (!moduleId || !action) {
      return NextResponse.json({ error: "moduleId et action sont obligatoires" }, { status: 400 });
    }

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const sessionClient = await getServerClient();
    if (!sessionClient) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const { data: { user } } = await sessionClient.auth.getUser();

    switch (action) {
      case "add_to_path": {
        if (!body.pathId) {
          return NextResponse.json({ error: "pathId est requis" }, { status: 400 });
        }
        await addModuleToPath(supabase, moduleId, body.pathId);
        return NextResponse.json({ success: true });
      }
      case "set_catalog_status": {
        if (typeof body.isActive !== "boolean") {
          return NextResponse.json({ error: "isActive est requis" }, { status: 400 });
        }
        const catalogItem = await ensureCatalogItem(supabase, moduleId);
        const { error } = await supabase
          .from(CATALOG_TABLE)
          .update({ is_active: body.isActive })
          .eq("id", catalogItem.id);
        if (error) {
          throw new Error(error.message || "Impossible de mettre à jour le catalogue");
        }
        return NextResponse.json({ success: true });
      }
      case "add_org": {
        if (!body.organizationId) {
          return NextResponse.json({ error: "organizationId est requis" }, { status: 400 });
        }
        const catalogItem = await ensureCatalogItem(supabase, moduleId);
        const { error } = await supabase
          .from(ACCESS_TABLE)
          .upsert(
            {
              organization_id: body.organizationId,
              catalog_item_id: catalogItem.id,
              access_status: "manually_granted",
              granted_by: user?.id ?? null,
              granted_at: new Date().toISOString(),
              grant_reason: "Accès accordé depuis le studio Super Admin",
            },
            { onConflict: "organization_id,catalog_item_id" },
          );
        if (error) {
          throw new Error(error.message || "Impossible d’accorder l’accès");
        }
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    }
  } catch (error) {
    console.error("[super-admin/modules/assign] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { action, moduleId, pathId, organizationId } = body as {
      action: string;
      moduleId?: string;
      pathId?: string;
      organizationId?: string;
    };

    if (!moduleId || !action) {
      return NextResponse.json({ error: "moduleId et action sont obligatoires" }, { status: 400 });
    }

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    switch (action) {
      case "remove_from_path": {
        if (!pathId) {
          return NextResponse.json({ error: "pathId est requis" }, { status: 400 });
        }
        await removeModuleFromPath(supabase, moduleId, pathId);
        return NextResponse.json({ success: true });
      }
      case "remove_org": {
        if (!organizationId) {
          return NextResponse.json({ error: "organizationId est requis" }, { status: 400 });
        }
        const catalogItem = await ensureCatalogItem(supabase, moduleId);
        const { error } = await supabase
          .from(ACCESS_TABLE)
          .delete()
          .eq("catalog_item_id", catalogItem.id)
          .eq("organization_id", organizationId);
        if (error) {
          throw new Error(error.message || "Impossible de retirer l’accès");
        }
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    }
  } catch (error) {
    console.error("[super-admin/modules/assign] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}


