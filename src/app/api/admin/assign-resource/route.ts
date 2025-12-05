import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendResourceAccessEmail } from "@/lib/emails/send-resource-access";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function POST(request: NextRequest) {
  console.log("[admin/assign-resource] POST request received");
  try {
    console.log("[admin/assign-resource] Checking super admin access...");
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      console.error("[admin/assign-resource] Access denied");
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    console.log("[admin/assign-resource] Super admin access granted");

    const body = await request.json();
    console.log("[admin/assign-resource] Request body:", { userId: body.userId, catalogItemId: body.catalogItemId });
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
      .from("catalog_access")
      .select("id, access_status")
      .eq("user_id", userId)
      .eq("catalog_item_id", catalogItemId)
      .is("organization_id", null)
      .maybeSingle();

    let access;
    let accessError;

    if (existingAccess) {
      // Si l'accès existe déjà, le mettre à jour (réassignation)
      console.log("[admin/assign-resource] Access already exists, updating...");
      const { data: updatedAccess, error: updateError } = await supabase
        .from("catalog_access")
        .update({
          access_status: "manually_granted",
          granted_by: jessicaProfile.id,
          granted_at: new Date().toISOString(),
          grant_reason: "Accès accordé manuellement par Jessica Contentin",
        })
        .eq("id", existingAccess.id)
        .select()
        .single();
      
      access = updatedAccess;
      accessError = updateError;
    } else {
      // Créer l'accès (utiliser catalog_access avec user_id pour B2C)
      console.log("[admin/assign-resource] Creating new access...");
      const { data: newAccess, error: insertError } = await supabase
        .from("catalog_access")
        .insert({
          user_id: userId,
          catalog_item_id: catalogItemId,
          organization_id: null, // B2C, pas d'organisation
          access_status: "manually_granted",
          granted_by: jessicaProfile.id,
          granted_at: new Date().toISOString(),
          grant_reason: "Accès accordé manuellement par Jessica Contentin",
        })
        .select()
        .single();
      
      access = newAccess;
      accessError = insertError;
    }

    if (accessError) {
      console.error("[admin/assign-resource] Error creating access:", JSON.stringify(accessError, null, 2));
      console.error("[admin/assign-resource] Error code:", accessError.code);
      console.error("[admin/assign-resource] Error message:", accessError.message);
      console.error("[admin/assign-resource] Error details:", accessError.details);
      console.error("[admin/assign-resource] Error hint:", accessError.hint);
      return NextResponse.json(
        { 
          error: "Erreur lors de l'assignation de la ressource",
          details: accessError.message,
          code: accessError.code,
          hint: accessError.hint
        },
        { status: 500 }
      );
    }

    // Construire l'URL de la ressource avec slug si disponible
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
    let resourceUrl = "";
    
    if (catalogItem.item_type === "ressource") {
      // Récupérer le slug de la ressource
      const { data: resource } = await supabase
        .from("resources")
        .select("slug")
        .eq("id", catalogItem.content_id)
        .maybeSingle();
      
      if (resource?.slug) {
        resourceUrl = `${baseUrl}/ressources/${resource.slug}`;
      } else {
        // Fallback sur l'ID si pas de slug
        resourceUrl = `${baseUrl}/ressources/${catalogItem.content_id || catalogItemId}`;
      }
    } else if (catalogItem.item_type === "test") {
      // Récupérer le slug du test
      const { data: test } = await supabase
        .from("tests")
        .select("slug")
        .eq("id", catalogItem.content_id)
        .maybeSingle();
      
      if (test?.slug) {
        // Pour le test de confiance en soi, utiliser l'URL spéciale
        if (test.slug === "test-confiance-en-soi") {
          resourceUrl = `${baseUrl}/test-confiance-en-soi`;
        } else {
          resourceUrl = `${baseUrl}/ressources/${test.slug}`;
        }
      } else {
        // Fallback sur l'ID si pas de slug
        resourceUrl = `${baseUrl}/test-confiance-en-soi`;
      }
    } else if (catalogItem.item_type === "module") {
      resourceUrl = `${baseUrl}/formations/${catalogItem.content_id || catalogItemId}`;
    } else {
      resourceUrl = `${baseUrl}/jessica-contentin/ressources`;
    }

    // Envoyer l'email de notification
    const firstName = userProfile.full_name?.split(" ")[0] || null;
    const userEmail = userProfile.email;
    
    if (!userEmail) {
      console.error("[admin/assign-resource] User email is missing");
      return NextResponse.json({
        success: true,
        access,
        emailSent: false,
        error: "Email utilisateur manquant",
      });
    }

    console.log("[admin/assign-resource] ====== EMAIL SENDING START ======");
    console.log("[admin/assign-resource] Sending email to:", userEmail);
    console.log("[admin/assign-resource] First name:", firstName);
    console.log("[admin/assign-resource] Resource title:", catalogItem.title);
    console.log("[admin/assign-resource] Resource URL:", resourceUrl);
    
    const emailResult = await sendResourceAccessEmail(
      userEmail,
      firstName,
      catalogItem.title,
      resourceUrl
    );

    console.log("[admin/assign-resource] ====== EMAIL SENDING RESULT ======");
    console.log("[admin/assign-resource] Email success:", emailResult.success);
    console.log("[admin/assign-resource] Email messageId:", emailResult.messageId);
    console.log("[admin/assign-resource] Email error:", emailResult.error);
    console.log("[admin/assign-resource] Full email result:", JSON.stringify(emailResult, null, 2));

    if (!emailResult.success) {
      console.error("[admin/assign-resource] ❌ ERROR: Email not sent!");
      console.error("[admin/assign-resource] Error details:", emailResult.error);
      // Ne pas échouer la requête si l'email échoue, l'accès a été créé
    } else {
      console.log("[admin/assign-resource] ✅ SUCCESS: Email sent successfully!");
    }

    return NextResponse.json({
      success: true,
      access,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      emailMessageId: emailResult.messageId,
    });
  } catch (error: any) {
    console.error("[admin/assign-resource] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'assignation de la ressource" },
      { status: 500 }
    );
  }
}

