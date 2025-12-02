import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/emails/brevo";
import { getSignupConfirmationEmail } from "@/lib/emails/templates/signup-confirmation";

/**
 * Inscription d'un candidat avec juste l'email
 * POST /api/beyond-connect/signup
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

    // Vérifier si l'email existe déjà
    const { data: usersList } = await supabaseService.auth.admin.listUsers();
    const existingUser = usersList?.users?.find((u) => u.email === email);

    if (existingUser) {
      // L'utilisateur existe déjà, on envoie quand même un email de confirmation
      // pour permettre la réinitialisation du mot de passe si nécessaire
      return NextResponse.json({ 
        error: "Cet email est déjà utilisé. Utilisez la fonction 'Mot de passe oublié' si vous avez déjà un compte." 
      }, { status: 400 });
    }

    // Créer un token de confirmation unique
    const confirmationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Valide 24h

    // Stocker le token temporairement (on peut utiliser une table ou le cache)
    // Pour l'instant, on va créer directement le compte avec Supabase Auth
    // qui enverra automatiquement l'email de confirmation

    // Créer le compte avec Supabase Auth (sans mot de passe pour l'instant)
    // On va utiliser un mot de passe temporaire aléatoire
    const tempPassword = crypto.randomUUID() + crypto.randomUUID();
    
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      email_confirm: false, // L'utilisateur devra confirmer via le lien
      user_metadata: {
        signup_source: "beyond_connect",
        confirmation_token: confirmationToken,
      },
    });

    if (authError) {
      console.error("[beyond-connect/signup] Auth error:", authError);
      
      // Gérer le cas où l'email existe déjà
      if (authError.message?.includes("already been registered") || authError.message?.includes("email_exists") || (authError as any).code === "email_exists") {
        return NextResponse.json({ 
          error: "Cet email est déjà utilisé. Utilisez la fonction 'Mot de passe oublié' si vous avez déjà un compte." 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: authError.message || "Erreur lors de la création du compte" 
      }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
    }

    // Créer le profil avec le rôle learner (seulement si le profil n'existe pas déjà)
    const { error: profileError } = await supabaseService
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: email,
        role: "learner",
        full_name: "",
      })
      .select()
      .maybeSingle();

    if (profileError) {
      // Si le profil existe déjà (erreur de clé unique), ce n'est pas grave
      if (profileError.code !== "23505") {
        console.error("[beyond-connect/signup] Profile error:", profileError);
        // On continue quand même, le profil peut être créé plus tard
      }
    }

    // Générer le lien de confirmation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const confirmationLink = `${baseUrl}/beyond-connect/confirmer?token=${confirmationToken}&email=${encodeURIComponent(email)}`;

    // Envoyer l'email de confirmation
    let emailSent = false;
    let emailError = null;
    
    try {
      const { html, text } = getSignupConfirmationEmail({
        email,
        confirmationLink,
      });

      const emailResult = await sendEmail({
        to: email,
        subject: "Confirmez votre inscription sur Beyond Connect",
        htmlContent: html,
        textContent: text,
      });

      if (emailResult.success) {
        emailSent = true;
      } else {
        emailError = emailResult.error;
        console.error("[beyond-connect/signup] Email error:", emailResult.error);
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[beyond-connect/signup] Email exception:", err);
    }

    // Si l'email n'a pas pu être envoyé, on retourne quand même un succès
    // mais avec un avertissement (l'utilisateur peut demander un nouveau lien)
    if (!emailSent) {
      console.warn("[beyond-connect/signup] Email not sent, but account created. User can request new link.");
      return NextResponse.json({ 
        success: true,
        message: "Compte créé avec succès, mais l'email de confirmation n'a pas pu être envoyé. Veuillez contacter le support ou réessayer plus tard.",
        warning: true,
        emailError: emailError,
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "Email de confirmation envoyé",
    });
  } catch (error) {
    console.error("[beyond-connect/signup] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

