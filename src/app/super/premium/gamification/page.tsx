import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export default async function PremiumGamificationPage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Rediriger vers la nouvelle route Beyond Play
  redirect("/super/premium/beyond-play");
}

