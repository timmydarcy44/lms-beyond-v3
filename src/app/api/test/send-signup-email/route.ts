import { NextRequest, NextResponse } from "next/server";
import { sendSignupConfirmationEmail } from "@/lib/emails/send";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Route de test pour envoyer un email de confirmation d'inscription
 * À supprimer après les tests
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const testEmail = email || "contentin.cabinet@gmail.com";

    // Récupérer le prénom de l'utilisateur
    const supabase = await getServerClient();
    let firstName: string | null = null;
    
    if (supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("email", testEmail)
        .maybeSingle();
      
      if (profile?.full_name) {
        firstName = profile.full_name.split(" ")[0] || null;
      }
    }

    // Générer un lien de confirmation de test
    // En production, ce lien serait généré par Supabase Auth
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
    const confirmationLink = `${baseUrl}/jessica-contentin/ressources?confirmed=true`;

    // Envoyer l'email via BREVO
    const result = await sendSignupConfirmationEmail(
      testEmail,
      firstName || "Jessica",
      confirmationLink
    );

    if (!result.success) {
      console.error("[test/send-signup-email] Error:", result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Failed to send email",
          details: "Vérifiez que BREVO_API_KEY est configurée dans les variables d'environnement"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      message: `Email de confirmation d'inscription envoyé à ${testEmail}`,
      details: "Vérifiez la boîte email (et les spams)"
    });
  } catch (error) {
    console.error("[test/send-signup-email] Exception:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

