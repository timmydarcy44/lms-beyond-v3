import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY manquante — impossible de lister toutes les organisations." },
        { status: 503 },
      );
    }

    const internalBadgesOnly =
      request.nextUrl.searchParams.get("internal_badges_only") === "1" ||
      request.nextUrl.searchParams.get("internal_badges_only") === "true";

    let query = serviceClient
      .from("organizations")
      .select("id, name, slug, created_at, wants_internal_badges")
      .order("name", { ascending: true });

    if (internalBadgesOnly) {
      query = query.eq("wants_internal_badges", true);
    }

    const { data: organizations, error } = await query;

    if (error) {
      console.error("[api/super-admin/organisations] Error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des organisations" },
        { status: 500 },
      );
    }

    return NextResponse.json({ organizations: organizations || [] });
  } catch (error) {
    console.error("[api/super-admin/organisations] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des organisations" },
      { status: 500 },
    );
  }
}

