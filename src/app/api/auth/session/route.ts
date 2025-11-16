import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDashboardRouteForRole } from "@/lib/auth/redirect";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est super admin
    const isSuper = await isSuperAdmin();
    
    console.log("[api/auth/session] User:", session.email, "isSuperAdmin:", isSuper);
    
    // Calculer la route du dashboard pour le rôle
    // Si super admin, rediriger vers /super
    const dashboardRoute = isSuper ? "/super" : getDashboardRouteForRole(session.role);

    console.log("[api/auth/session] Dashboard route:", dashboardRoute);

    return NextResponse.json({
      ...session,
      dashboardRoute,
      isSuperAdmin: isSuper,
    });
  } catch (error) {
    console.error("[api/auth/session] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

