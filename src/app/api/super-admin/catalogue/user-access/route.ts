import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";
const TEST_CONTENT_ID = "test-confiance-en-soi";

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est super admin
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
    }

    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      return NextResponse.json({ error: "Profil créateur introuvable" }, { status: 500 });
    }

    // Chercher le test dans la table tests par slug
    const { data: test } = await serviceClient
      .from("tests")
      .select("id")
      .eq("slug", TEST_CONTENT_ID)
      .maybeSingle();

    if (!test) {
      return NextResponse.json({ accesses: [] }, { status: 200 });
    }

    // Chercher l'item de catalogue pour le test
    const { data: catalogItem } = await serviceClient
      .from("catalog_items")
      .select("id, title")
      .eq("content_id", test.id) // Utiliser l'UUID du test
      .eq("creator_id", jessicaProfile.id)
      .eq("item_type", "test")
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json({ accesses: [] }, { status: 200 });
    }

    // Récupérer tous les accès utilisateurs pour ce test
    const { data: accesses, error } = await serviceClient
      .from("catalog_item_access")
      .select(`
        id,
        user_id,
        catalog_item_id,
        access_status,
        access_type,
        granted_by,
        granted_at,
        grant_reason,
        profiles!catalog_item_access_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq("catalog_item_id", catalogItem.id)
      .in("access_status", ["purchased", "manually_granted", "free"])
      .order("granted_at", { ascending: false });

    if (error) {
      console.error("[user-access] Error:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    const formattedAccesses = (accesses || []).map((access: any) => ({
      id: access.id,
      user_id: access.user_id,
      user_email: access.profiles?.email || "",
      user_name: access.profiles?.full_name || null,
      catalog_item_id: access.catalog_item_id,
      catalog_item_title: catalogItem.title,
      access_status: access.access_status,
      granted_by: access.granted_by,
      granted_at: access.granted_at,
      grant_reason: access.grant_reason,
    }));

    return NextResponse.json({ accesses: formattedAccesses }, { status: 200 });
  } catch (error) {
    console.error("[user-access] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

