import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminNewModulePage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Rediriger vers la page de choix de méthode
  redirect("/super/studio/modules/new/choose");
}

