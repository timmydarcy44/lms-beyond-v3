import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/emails/brevo";
import { getSignupConfirmationEmail } from "@/lib/emails/templates";

/**
 * Inscription d'un utilisateur pour Jessica Contentin
 * POST /api/jessica-contentin/signup
 * 
 * Cette route utilise le service role client pour créer le compte
 * sans déclencher l'envoi d'email de Supabase, puis utilise Brevo pour l'email.
 * Cela évite les problèmes de rate limit de Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Validation
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Le prénom et le nom sont requis" }, { status: 400 });
    }

    const supabaseService = getServiceRoleClient();
    if (!supabaseService) {
      return NextResponse.json({ error: "Service non disponible" }, { status: 500 });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    // Vérifier si l'email existe déjà
    const { data: usersList } = await supabaseService.auth.admin.listUsers();
    const existingUser = usersList?.users?.find((u) => u.email === email);

    if (existingUser) {
      return NextResponse.json({ 
        error: "Cet email est déjà utilisé. Connectez-vous ou utilisez la fonction 'Mot de passe oublié'." 
      }, { status: 400 });
    }

    // Créer le compte avec Supabase Auth Admin (sans déclencher l'envoi d'email)
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // L'utilisateur devra confirmer via le lien
      user_metadata: {
        full_name: fullName,
        role: "learner",
        signup_source: "jessica_contentin",
      },
    });

    if (authError) {
      console.error("[jessica-contentin/signup] Auth error:", authError);
      
      // Gérer le cas où l'email existe déjà
      if (authError.message?.includes("already been registered") || 
          authError.message?.includes("email_exists") || 
          (authError as any).code === "email_exists") {
        return NextResponse.json({ 
          error: "Cet email est déjà utilisé. Connectez-vous ou utilisez la fonction 'Mot de passe oublié'." 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: authError.message || "Erreur lors de la création du compte" 
      }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
    }

    // Créer le profil
    const { error: profileError } = await supabaseService
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: "learner",
      });

    if (profileError) {
      // Si le profil existe déjà (erreur de clé unique), ce n'est pas grave
      if (profileError.code !== "23505") {
        console.error("[jessica-contentin/signup] Profile error:", profileError);
        // On continue quand même, le profil peut être créé plus tard
      }
    }

    // Générer le lien de confirmation
    // Utiliser generateLink pour créer un lien de confirmation valide
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
      type: "signup",
      email: email,
      password: password, // Requis pour le type "signup" dans les nouvelles versions
      options: {
        redirectTo: `${baseUrl}/jessica-contentin/confirmer`,
      },
    });

    let confirmationLink = `${baseUrl}/jessica-contentin/confirmer`;
    if (linkData?.properties?.action_link) {
      confirmationLink = linkData.properties.action_link;
    } else if (linkError) {
      console.warn("[jessica-contentin/signup] Could not generate confirmation link:", linkError);
      // Fallback: utiliser un lien simple (l'utilisateur devra se connecter manuellement)
      confirmationLink = `${baseUrl}/jessica-contentin/login?confirmed=false`;
    }

    // Envoyer l'email de confirmation via Brevo
    let emailSent = false;
    let emailError = null;
    
    try {
      const template = getSignupConfirmationEmail({
        email,
        confirmationLink,
        firstName: firstName,
        loginLink: `${baseUrl}/jessica-contentin/login`,
      });

      const emailResult = await sendEmail({
        to: email,
        subject: template.subject,
        htmlContent: template.html,
        textContent: template.text,
        tags: ["jessica-contentin", "signup", "confirmation"],
      });

      if (emailResult.success) {
        emailSent = true;
        console.log("[jessica-contentin/signup] ✅ Email sent successfully via Brevo");
      } else {
        emailError = emailResult.error;
        console.error("[jessica-contentin/signup] ❌ Email error:", emailResult.error);
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[jessica-contentin/signup] ❌ Email exception:", err);
    }

    // Si l'email n'a pas pu être envoyé, on retourne quand même un succès
    // mais avec un avertissement (l'utilisateur peut demander un nouveau lien)
    if (!emailSent) {
      console.warn("[jessica-contentin/signup] ⚠️ Email not sent, but account created. User can request new link.");
      return NextResponse.json({ 
        success: true,
        userId: authData.user.id,
        message: "Compte créé avec succès, mais l'email de confirmation n'a pas pu être envoyé. Veuillez contacter le support ou réessayer plus tard.",
        warning: true,
        emailError: emailError,
      });
    }

    return NextResponse.json({ 
      success: true,
      userId: authData.user.id,
      message: "Compte créé avec succès. Un email de confirmation a été envoyé.",
    });
  } catch (error) {
    console.error("[jessica-contentin/signup] ❌ Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

