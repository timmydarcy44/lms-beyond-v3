import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { CandidateConfirmationPage } from "@/components/beyond-connect/candidate-confirmation-page";
import { sendEmail } from "@/lib/emails/brevo";
import { getBeyondConnectWelcomeEmail } from "@/lib/emails/templates/beyond-connect-welcome";
import { getBeyondConnectBaseUrl } from "@/lib/beyond-connect/utils";

export const metadata: Metadata = {
  title: "Confirmation d'inscription - Beyond Connect",
  description: "Confirmez votre inscription",
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const { token, email } = params;

  if (!token || !email) {
    redirect("/beyond-connect/inscription?error=invalid_link");
  }

  // Vérifier le token et confirmer l'email
  const supabaseService = getServiceRoleClient();
  if (!supabaseService) {
    redirect("/beyond-connect/inscription?error=service_unavailable");
  }

  // Trouver l'utilisateur par email - méthode alternative via profiles si listUsers échoue
  let userData = null;
  
  try {
    const { data: usersList, error: listError } = await supabaseService.auth.admin.listUsers();
    if (!listError && usersList?.users) {
      userData = usersList.users.find((u) => u.email === email);
    }
  } catch (error) {
    console.error("[beyond-connect/confirmer] Error listing users:", error);
  }

  // Si on n'a pas trouvé l'utilisateur via listUsers, essayer via profiles
  if (!userData) {
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (profile) {
      // Récupérer l'utilisateur par ID
      try {
        const { data: userById } = await supabaseService.auth.admin.getUserById(profile.id);
        if (userById?.user) {
          userData = userById.user;
        }
      } catch (error) {
        console.error("[beyond-connect/confirmer] Error getting user by ID:", error);
      }
    }
  }

  if (!userData) {
    redirect("/beyond-connect/inscription?error=user_not_found");
  }

  // Vérifier le token dans les metadata
  const confirmationToken = userData.user_metadata?.confirmation_token;
  if (confirmationToken !== token) {
    redirect("/beyond-connect/inscription?error=invalid_token");
  }

  // Confirmer l'email de l'utilisateur
  await supabaseService.auth.admin.updateUserById(userData.id, {
    email_confirm: true,
  });

  // Récupérer le profil pour obtenir le prénom
  const { data: profile } = await supabaseService
    .from("profiles")
    .select("first_name, full_name")
    .eq("id", userData.id)
    .maybeSingle();

  const firstName = profile?.first_name || profile?.full_name?.split(" ")[0] || undefined;
  const baseUrl = getBeyondConnectBaseUrl();
  const dashboardLink = `${baseUrl}/beyond-connect-app`;
  const redirectTo = `${baseUrl}/beyond-connect-app/onboarding`;

  // Envoyer l'email de bienvenue
  try {
    const { html, text } = getBeyondConnectWelcomeEmail({
      firstName,
      email,
      dashboardLink,
    });

    await sendEmail({
      to: email,
      subject: "Bienvenue sur Beyond Connect ! 🎉",
      htmlContent: html,
      textContent: text,
      tags: ["beyond-connect", "welcome"],
    });
  } catch (emailError) {
    console.error("[beyond-connect/confirmer] Error sending welcome email:", emailError);
    // On continue même si l'email échoue
  }

  // Générer un magic link pour connecter l'utilisateur et rediriger vers l'onboarding
  
  const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
    type: "magiclink",
    email: email,
  });

  if (linkError || !linkData?.properties?.action_link) {
    // Si on ne peut pas générer de lien, rediriger vers la page de login avec un message
    redirect("/beyond-connect/login?email=" + encodeURIComponent(email) + "&confirmed=true&next=/beyond-connect-app/onboarding");
  }

  // Modifier le lien pour rediriger vers l'onboarding après connexion
  const magicLink = linkData.properties.action_link;
  const customMagicLink = magicLink.includes("redirect_to=")
    ? magicLink.replace(/redirect_to=[^&]*/, `redirect_to=${encodeURIComponent(redirectTo)}`)
    : magicLink + (magicLink.includes("?") ? "&" : "?") + `redirect_to=${encodeURIComponent(redirectTo)}`;

  // Rediriger vers le magic link qui connectera automatiquement l'utilisateur
  // Le magic link redirigera ensuite vers l'onboarding
  redirect(customMagicLink);
}

