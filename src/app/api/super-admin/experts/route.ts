import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY manquante." },
        { status: 503 },
      );
    }

    const { data: experts, error } = await serviceClient
      .from("experts")
      .select("id, first_name, last_name, specialty")
      .order("last_name", { ascending: true });

    if (error) {
      console.error("[api/super-admin/experts]", error);
      return NextResponse.json({ error: "Erreur lors de la récupération des experts" }, { status: 500 });
    }

    return NextResponse.json({ experts: experts ?? [] });
  } catch (error) {
    console.error("[api/super-admin/experts]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
