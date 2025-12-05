import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendResourceAccessEmail } from "@/lib/emails/send-resource-access";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est super admin
    const session = await getSession();
    const isSuper = await isSuperAdmin();
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { userEmail, contentId, reason } = body as {
      userEmail: string;
      contentId: string;
      reason?: string | null;
    };

    if (!userEmail || !contentId) {
      return NextResponse.json({ error: "Email et contentId requis" }, { status: 400 });
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

    // Trouver l'utilisateur par email
    const { data: userProfile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Chercher le test dans la table tests par slug
    const { data: test } = await serviceClient
      .from("tests")
      .select("id")
      .eq("slug", contentId)
      .maybeSingle();

    if (!test) {
      return NextResponse.json({ error: "Test introuvable" }, { status: 404 });
    }

    // Chercher l'item de catalogue
    const { data: catalogItem } = await serviceClient
      .from("catalog_items")
      .select("id, title")
      .eq("content_id", test.id) // Utiliser l'UUID du test
      .eq("creator_id", jessicaProfile.id)
      .eq("item_type", "test")
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json({ error: "Item de catalogue introuvable" }, { status: 404 });
    }

    // Vérifier si l'accès existe déjà
    const { data: existingAccess } = await serviceClient
      .from("catalog_access")
      .select("id, access_status")
      .eq("user_id", userProfile.id)
      .eq("catalog_item_id", catalogItem.id)
      .maybeSingle();

    if (existingAccess) {
      // Mettre à jour l'accès existant
      const { error: updateError } = await serviceClient
        .from("catalog_access")
        .update({
          access_status: "manually_granted",
          granted_by: session.id,
          granted_at: new Date().toISOString(),
          grant_reason: reason || null,
        })
        .eq("id", existingAccess.id);

      if (updateError) {
        console.error("[grant-user-access] Update error:", updateError);
        return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
      }

      // Envoyer l'email de notification
      try {
        const { data: userProfileForEmail } = await serviceClient
          .from("profiles")
          .select("full_name, email")
          .eq("id", userProfile.id)
          .maybeSingle();

        if (userProfileForEmail?.email) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
          const resourceUrl = `${baseUrl}/test-confiance-en-soi`;
          const firstName = userProfileForEmail.full_name?.split(" ")[0] || null;

          await sendResourceAccessEmail(
            userProfileForEmail.email,
            firstName,
            catalogItem.title || "Test de Confiance en soi",
            resourceUrl
          );
        }
      } catch (emailError) {
        console.error("[grant-user-access] Error sending email:", emailError);
        // Ne pas échouer la requête si l'email échoue
      }

      return NextResponse.json({ success: true, message: "Accès mis à jour" }, { status: 200 });
    }

    // Créer un nouvel accès
    const { error: insertError } = await serviceClient
      .from("catalog_access")
      .insert({
        user_id: userProfile.id,
        catalog_item_id: catalogItem.id,
        access_status: "manually_granted",
        granted_by: session.id,
        granted_at: new Date().toISOString(),
        grant_reason: reason || null,
      });

    if (insertError) {
      console.error("[grant-user-access] Insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de la création de l'accès" }, { status: 500 });
    }

    // Envoyer l'email de notification
    try {
      const { data: userProfileForEmail } = await serviceClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", userProfile.id)
        .maybeSingle();

      if (userProfileForEmail?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
        const resourceUrl = `${baseUrl}/test-confiance-en-soi`;
        const firstName = userProfileForEmail.full_name?.split(" ")[0] || null;

        await sendResourceAccessEmail(
          userProfileForEmail.email,
          firstName,
          catalogItem.title || "Test de Confiance en soi",
          resourceUrl
        );
      }
    } catch (emailError) {
      console.error("[grant-user-access] Error sending email:", emailError);
      // Ne pas échouer la requête si l'email échoue
    }

    return NextResponse.json({ success: true, message: "Accès accordé avec succès" }, { status: 200 });
  } catch (error) {
    console.error("[grant-user-access] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'attribution de l'accès" },
      { status: 500 }
    );
  }
}

