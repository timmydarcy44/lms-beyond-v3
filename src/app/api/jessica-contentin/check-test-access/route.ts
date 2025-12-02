import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";
const TEST_CONTENT_ID = "test-confiance-en-soi"; // ID unique du test

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ hasAccess: false, error: "Service indisponible" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ hasAccess: false, requiresAuth: true }, { status: 200 });
    }

    // Récupérer l'ID de Jessica Contentin
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;
    
    const { data: jessicaProfile } = await clientToUse
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      return NextResponse.json({ hasAccess: false, error: "Profil créateur introuvable" }, { status: 500 });
    }

    // Chercher le test dans la table tests par slug
    const { data: test } = await clientToUse
      .from("tests")
      .select("id")
      .eq("slug", TEST_CONTENT_ID)
      .maybeSingle();

    if (!test) {
      return NextResponse.json({ 
        hasAccess: false, 
        requiresPayment: true,
        catalogItemId: null 
      }, { status: 200 });
    }

    // Chercher l'item de catalogue pour le test
    const { data: catalogItem } = await clientToUse
      .from("catalog_items")
      .select("id, content_id, creator_id, is_free")
      .eq("content_id", test.id) // Utiliser l'UUID du test
      .eq("creator_id", jessicaProfile.id)
      .eq("item_type", "test")
      .maybeSingle();

    if (!catalogItem) {
      // Si l'item n'existe pas, l'utilisateur n'a pas accès
      return NextResponse.json({ 
        hasAccess: false, 
        requiresPayment: true,
        catalogItemId: null 
      }, { status: 200 });
    }

    // Vérifier l'accès de l'utilisateur
    const { data: access } = await clientToUse
      .from("catalog_item_access")
      .select("access_status, access_type")
      .eq("user_id", user.id)
      .eq("catalog_item_id", catalogItem.id)
      .in("access_status", ["purchased", "manually_granted", "free"])
      .maybeSingle();

    // Si l'item est gratuit, l'accès est automatique
    if (catalogItem.is_free) {
      return NextResponse.json({ 
        hasAccess: true, 
        accessType: "free",
        catalogItemId: catalogItem.id 
      }, { status: 200 });
    }

    // Si l'utilisateur a un accès
    if (access) {
      return NextResponse.json({ 
        hasAccess: true, 
        accessType: access.access_status,
        catalogItemId: catalogItem.id 
      }, { status: 200 });
    }

    // Pas d'accès
    return NextResponse.json({ 
      hasAccess: false, 
      requiresPayment: true,
      catalogItemId: catalogItem.id 
    }, { status: 200 });
  } catch (error) {
    console.error("[check-test-access] Error:", error);
    return NextResponse.json(
      { hasAccess: false, error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}

