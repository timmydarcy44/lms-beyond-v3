import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/emails/send";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Récupérer le client Supabase
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 500 }
      );
    }

    // Récupérer le prénom de l'utilisateur
    let firstName: string | null = null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("email", email)
      .maybeSingle();
    
    if (profile?.full_name) {
      firstName = profile.full_name.split(" ")[0] || null;
    }

    // Générer le lien de réinitialisation via Supabase
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
    const redirectUrl = `${baseUrl}/jessica-contentin/reset-password`;
    
    const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      console.error("[api/emails/send-password-reset] Supabase error:", resetError);
      // On continue quand même pour ne pas révéler si l'email existe ou non
    }

    // Construire le lien de réinitialisation
    // Le token sera dans l'URL quand Supabase redirigera
    const resetLink = redirectUrl;

    // Envoyer l'email via BREVO
    const result = await sendPasswordResetEmail(
      email,
      firstName,
      resetLink
    );

    if (!result.success) {
      console.error("[api/emails/send-password-reset] Error:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("[api/emails/send-password-reset] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

