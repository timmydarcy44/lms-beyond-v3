import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function GET() {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await getServiceRoleClientOrFallback();

    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("[api/super-admin/organizations] Error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des organisations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ organizations: organizations || [] });
  } catch (error) {
    console.error("[api/super-admin/organizations] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des organisations" },
      { status: 500 }
    );
  }
}

