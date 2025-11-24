import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getCatalogItemsByCreatorEmail } from "@/lib/queries/super-admin-catalogue";

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    const items = await getCatalogItemsByCreatorEmail(email);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/super-admin/catalogue/items-by-creator] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des items" },
      { status: 500 }
    );
  }
}









