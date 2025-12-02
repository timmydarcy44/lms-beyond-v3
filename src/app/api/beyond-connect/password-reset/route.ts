import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/emails/brevo";
import { getBeyondConnectPasswordResetEmail } from "@/lib/emails/templates/beyond-connect-password-reset";

/**
 * Demande de réinitialisation de mot de passe
 * POST /api/beyond-connect/password-reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const supabaseService = getServiceRoleClient();
    if (!supabaseService) {
      return NextResponse.json({ error: "Service non disponible" }, { status: 500 });
    }

    // Vérifier si l'utilisateur existe
    const { data: usersList } = await supabaseService.auth.admin.listUsers();
    const userData = usersList?.users?.find((u) => u.email === email);

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    // On retourne toujours un succès même si l'email n'existe pas
    if (!userData) {
      // On attend un peu pour éviter les attaques par énumération
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
      });
    }

    // Générer un lien de réinitialisation via Supabase Auth
    const { data: resetData, error: resetError } = await supabaseService.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });

    if (resetError || !resetData?.properties?.action_link) {
      console.error("[beyond-connect/password-reset] Error generating reset link:", resetError);
      // On retourne quand même un succès pour ne pas révéler si l'email existe
      return NextResponse.json({
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
      });
    }

    const resetLink = resetData.properties.action_link;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Remplacer l'URL de redirection par défaut par notre page
    const customResetLink = resetLink.replace(
      /redirect_to=[^&]*/,
      `redirect_to=${encodeURIComponent(`${baseUrl}/beyond-connect/reset-password`)}`
    );

    // Envoyer l'email de réinitialisation
    try {
      const { html, text } = getBeyondConnectPasswordResetEmail({
        email,
        resetLink: customResetLink,
        expiresIn: 60, // 60 minutes
      });

      const emailResult = await sendEmail({
        to: email,
        subject: "Réinitialisation de votre mot de passe - Beyond Connect",
        htmlContent: html,
        textContent: text,
        tags: ["beyond-connect", "password-reset"],
      });

      if (!emailResult.success) {
        console.error("[beyond-connect/password-reset] Error sending email:", emailResult.error);
      }
    } catch (emailError) {
      console.error("[beyond-connect/password-reset] Error sending email:", emailError);
      // On continue même si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("[beyond-connect/password-reset] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la demande de réinitialisation" },
      { status: 500 }
    );
  }
}

