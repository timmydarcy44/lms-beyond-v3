import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export default async function PremiumPage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Rediriger vers la page d'analyse avancée par défaut
  redirect("/super/premium/analyse-avancee");
}




