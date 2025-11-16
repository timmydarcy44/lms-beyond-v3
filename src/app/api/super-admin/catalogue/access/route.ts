import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getCatalogAccessForSuperAdmin } from "@/lib/queries/super-admin-catalogue";

export async function GET() {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const accesses = await getCatalogAccessForSuperAdmin();
    return NextResponse.json({ accesses });
  } catch (error) {
    console.error("[api/super-admin/catalogue/access] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des accès" },
      { status: 500 }
    );
  }
}




