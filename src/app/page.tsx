import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    // Si pas de session, rediriger vers la landing page
    redirect("/landing");
  }

  // Rediriger vers la page de chargement qui affichera "Bonjour (prénom)" puis redirigera vers le dashboard
  redirect("/loading");
}
