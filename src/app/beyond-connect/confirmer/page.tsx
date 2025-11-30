import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { CandidateConfirmationPage } from "@/components/beyond-connect/candidate-confirmation-page";

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

  // Trouver l'utilisateur par email
  const { data: usersList } = await supabaseService.auth.admin.listUsers();
  const userData = usersList?.users?.find((u) => u.email === email);

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

  // Générer un magic link pour connecter l'utilisateur
  const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
    type: "magiclink",
    email: email,
  });

  if (linkError || !linkData?.properties?.action_link) {
    // Si on ne peut pas générer de lien, rediriger vers la page de login
    redirect("/beyond-connect/login?email=" + encodeURIComponent(email) + "&confirmed=true");
  }

  // Rediriger vers le magic link qui connectera automatiquement l'utilisateur
  // Le magic link redirigera ensuite vers l'onboarding
  redirect(linkData.properties.action_link.replace(/#.*$/, "") + "#access_token=" + linkData.properties.hashed_token + "&type=magiclink&redirect_to=" + encodeURIComponent("/beyond-connect-app/onboarding"));
}

