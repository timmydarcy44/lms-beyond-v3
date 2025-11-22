import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, contentIds } = body;

    if (!organizationId || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: "organizationId et contentIds sont requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // Pour chaque contenu, mettre à jour son org_id
    const updates = [];
    for (const contentId of contentIds) {
      // Déterminer le type de contenu en vérifiant dans chaque table
      const [courseCheck, pathCheck, resourceCheck, testCheck] = await Promise.all([
        supabase.from("courses").select("id").eq("id", contentId).single(),
        supabase.from("paths").select("id").eq("id", contentId).single(),
        supabase.from("resources").select("id").eq("id", contentId).single(),
        supabase.from("tests").select("id").eq("id", contentId).single(),
      ]);

      if (courseCheck.data) {
        updates.push(
          supabase.from("courses").update({ org_id: organizationId }).eq("id", contentId)
        );
      } else if (pathCheck.data) {
        updates.push(
          supabase.from("paths").update({ org_id: organizationId }).eq("id", contentId)
        );
      } else if (resourceCheck.data) {
        updates.push(
          supabase.from("resources").update({ org_id: organizationId }).eq("id", contentId)
        );
      } else if (testCheck.data) {
        updates.push(
          supabase.from("tests").update({ org_id: organizationId }).eq("id", contentId)
        );
      }
    }

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error("[super-admin] Errors assigning content:", errors);
      return NextResponse.json(
        { error: "Erreur lors de l'assignation de certains contenus" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${contentIds.length} élément(s) assigné(s) avec succès`,
    });
  } catch (error) {
    console.error("[super-admin] Error assigning content to organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'assignation" },
      { status: 500 }
    );
  }
}








