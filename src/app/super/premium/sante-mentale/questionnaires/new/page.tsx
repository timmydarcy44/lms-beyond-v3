import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export default async function NewQuestionnairePage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Rediriger vers la nouvelle route Beyond Care
  redirect("/super/premium/beyond-care/questionnaires/new");
}

