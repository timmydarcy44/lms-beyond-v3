import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDashboardRouteForRole } from "@/lib/auth/redirect";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    console.log("[dashboard] No session found, redirecting to /login");
    redirect("/login");
  }

  console.log(`[dashboard] User ${session.email} (${session.id}) with role: ${session.role}, fullName: ${session.fullName}`);

  // Vérifier si l'utilisateur est super admin
  const isSuper = await isSuperAdmin();
  
  if (isSuper) {
    console.log(`[dashboard] User ${session.email} is super admin, redirecting to /super`);
    redirect("/super");
  }

  // Rediriger vers le dashboard approprié selon le rôle
  const dashboardRoute = getDashboardRouteForRole(session.role);
  console.log(`[dashboard] Redirecting ${session.email} (role: ${session.role}) to ${dashboardRoute}`);
  redirect(dashboardRoute);
}
