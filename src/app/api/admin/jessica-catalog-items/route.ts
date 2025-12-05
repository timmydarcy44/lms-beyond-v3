import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";
const JESSICA_CONTENTIN_UUID = "17364229-fe78-4986-ac69-41b880e34631";

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    // Récupérer tous les catalog_items de Jessica Contentin
    const { data: catalogItems, error } = await supabase
      .from("catalog_items")
      .select("id, title, item_type, price, is_active")
      .eq("created_by", JESSICA_CONTENTIN_UUID)
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (error) {
      console.error("[admin/jessica-catalog-items] Error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des items" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: catalogItems || [] });
  } catch (error) {
    console.error("[admin/jessica-catalog-items] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

