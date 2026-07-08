import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendResourceAccessEmail } from "@/lib/emails/send-resource-access";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  assignJessicaCourseToUser,
  catalogItemsTableExists,
  getJessicaStudioCourseIds,
  isJessicaAssignableCatalogItem,
  resolveJessicaProfileId,
  syncJessicaStudioCatalog,
} from "@/lib/jessica-contentin/sync-jessica-catalog";

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

    const jessicaId = jessicaProfile.id ?? (await resolveJessicaProfileId(supabase));
    const hasCatalogTable = await catalogItemsTableExists(supabase);
    if (hasCatalogTable) {
      await syncJessicaStudioCatalog(supabase, jessicaId);
    }
    const studioCourseIds = await getJessicaStudioCourseIds(supabase);

    let catalogItem: {
      id: string;
      title: string;
      item_type: string;
      content_id: string | null;
      creator_id?: string | null;
      created_by?: string | null;
      is_active?: boolean;
    } | null = null;

    if (hasCatalogTable) {
      const { data } = await supabase
        .from("catalog_items")
        .select("id, title, item_type, content_id, creator_id, created_by, is_active")
        .eq("id", catalogItemId)
        .maybeSingle();
      catalogItem = data;
    }

    // Fallback : catalogItemId = course_id studio (sans table catalog_items)
    if (!catalogItem && studioCourseIds.has(String(catalogItemId))) {
      const { data: course } = await supabase
        .from("courses")
        .select("id, title")
        .eq("id", catalogItemId)
        .maybeSingle();
      if (course) {
        catalogItem = {
          id: course.id,
          title: course.title,
          item_type: "module",
          content_id: course.id,
          is_active: true,
        };
      }
    }

    if (!catalogItem || !isJessicaAssignableCatalogItem(catalogItem, jessicaId, studioCourseIds)) {
      return NextResponse.json(
        { error: "Ressource non trouvée ou n'appartient pas à Jessica" },
        { status: 404 }
      );
    }

    if (hasCatalogTable && catalogItem.is_active === false) {
      await supabase
        .from("catalog_items")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("id", catalogItemId);
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

    const courseIdForEnrollment = String(catalogItem.content_id || catalogItemId);
    const useCourseEnrollment =
      !hasCatalogTable || (catalogItem.id === courseIdForEnrollment && studioCourseIds.has(courseIdForEnrollment));

    let access: Record<string, unknown> | null = null;

    if (useCourseEnrollment) {
      const enrollment = await assignJessicaCourseToUser(
        supabase,
        courseIdForEnrollment,
        userId,
        jessicaId,
      );
      if (!enrollment.ok) {
        return NextResponse.json(
          { error: enrollment.error || "Erreur lors de l'assignation de la formation" },
          { status: 500 },
        );
      }
      access = { via: "course_enrollments", course_id: courseIdForEnrollment, user_id: userId };
    } else {
      const realCatalogItemId = catalogItem.id;

      const { data: existingAccess } = await supabase
        .from("catalog_access")
        .select("id, access_status")
        .eq("user_id", userId)
        .eq("catalog_item_id", realCatalogItemId)
        .is("organization_id", null)
        .maybeSingle();

      let accessError;

      if (existingAccess) {
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
        const { data: newAccess, error: insertError } = await supabase
          .from("catalog_access")
          .insert({
            user_id: userId,
            catalog_item_id: realCatalogItemId,
            organization_id: null,
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
        return NextResponse.json(
          {
            error: "Erreur lors de l'assignation de la ressource",
            details: accessError.message,
            code: accessError.code,
            hint: accessError.hint,
          },
          { status: 500 },
        );
      }

      await assignJessicaCourseToUser(supabase, courseIdForEnrollment, userId, jessicaId);
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

