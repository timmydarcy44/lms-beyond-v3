import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendResourceAccessEmail } from "@/lib/emails/send-resource-access";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, catalogItemId } = body;

    if (!userId || !catalogItemId) {
      return NextResponse.json(
        { error: "userId et catalogItemId sont requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 503 }
      );
    }

    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      return NextResponse.json(
        { error: "Profil Jessica Contentin non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le catalog_item appartient à Jessica
    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("id, title, item_type, content_id, creator_id")
      .eq("id", catalogItemId)
      .eq("creator_id", jessicaProfile.id)
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Ressource non trouvée ou n'appartient pas à Jessica" },
        { status: 404 }
      );
    }

    // Récupérer les informations de l'utilisateur
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'accès existe déjà
    const { data: existingAccess } = await supabase
      .from("catalog_item_access")
      .select("id")
      .eq("user_id", userId)
      .eq("catalog_item_id", catalogItemId)
      .maybeSingle();

    if (existingAccess) {
      return NextResponse.json(
        { error: "L'utilisateur a déjà accès à cette ressource" },
        { status: 400 }
      );
    }

    // Créer l'accès (utiliser upsert pour éviter les doublons)
    const { data: access, error: accessError } = await supabase
      .from("catalog_item_access")
      .upsert({
        user_id: userId,
        catalog_item_id: catalogItemId,
        access_type: "manually_granted",
        granted_at: new Date().toISOString(),
        metadata: {
          granted_by: jessicaProfile.id,
          grant_reason: "Accès accordé manuellement par Jessica Contentin",
        },
      }, {
        onConflict: "user_id,catalog_item_id",
      })
      .select()
      .single();

    if (accessError) {
      console.error("[admin/assign-resource] Error creating access:", accessError);
      return NextResponse.json(
        { error: "Erreur lors de l'assignation de la ressource" },
        { status: 500 }
      );
    }

    // Construire l'URL de la ressource
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
    let resourceUrl = "";
    
    if (catalogItem.item_type === "ressource") {
      resourceUrl = `${baseUrl}/ressources/${catalogItem.content_id || catalogItemId}`;
    } else if (catalogItem.item_type === "module") {
      resourceUrl = `${baseUrl}/formations/${catalogItem.content_id || catalogItemId}`;
    } else if (catalogItem.item_type === "test") {
      resourceUrl = `${baseUrl}/dashboard/catalogue/test/${catalogItem.content_id || catalogItemId}`;
    } else {
      resourceUrl = `${baseUrl}/jessica-contentin/ressources`;
    }

    // Envoyer l'email de notification
    const firstName = userProfile.full_name?.split(" ")[0] || null;
    const emailResult = await sendResourceAccessEmail(
      userProfile.email || "",
      firstName,
      catalogItem.title,
      resourceUrl
    );

    if (!emailResult.success) {
      console.error("[admin/assign-resource] Error sending email:", emailResult.error);
      // Ne pas échouer la requête si l'email échoue, l'accès a été créé
    }

    return NextResponse.json({
      success: true,
      access,
      emailSent: emailResult.success,
    });
  } catch (error: any) {
    console.error("[admin/assign-resource] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'assignation de la ressource" },
      { status: 500 }
    );
  }
}

