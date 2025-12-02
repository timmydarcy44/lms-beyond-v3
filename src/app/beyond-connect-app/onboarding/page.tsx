import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { CandidateOnboardingPage } from "@/components/beyond-connect/candidate-onboarding-page";

export const metadata: Metadata = {
  title: "Créer mon profil - Beyond Connect",
  description: "Créez votre profil candidat sur Beyond Connect",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; force?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const forceAccess = params.force === "true";

  // Si un token est fourni (depuis l'email de confirmation), on peut essayer de connecter l'utilisateur
  // Sinon, vérifier la session normale
  if (!session && !params.token) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/onboarding");
  }

  // Si on a un token mais pas de session, on redirige vers la page de confirmation
  if (params.token && !session) {
    redirect(`/beyond-connect/confirmer?token=${params.token}`);
  }

  // Si l'utilisateur a déjà complété son profil (first_name et last_name), rediriger vers le profil
  // SAUF si force=true est passé en paramètre (pour permettre l'accès direct)
  if (session && !forceAccess) {
    const supabase = await getServerClient();
    if (supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", session.id)
        .single();

      if (profile?.first_name && profile?.last_name) {
        redirect("/beyond-connect-app/profile");
      }
    }
  }

  return <CandidateOnboardingPage userId={session?.id || ""} />;
}

