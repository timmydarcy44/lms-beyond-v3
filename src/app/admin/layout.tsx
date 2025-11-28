import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { AdminLayoutWrapper } from "@/components/admin/AdminLayoutWrapper";
import { getOrganizationLogo } from "@/lib/queries/super-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.id) {
    console.log("[admin/layout] No session found, redirecting to /login");
    redirect("/login");
  }

  // Si c'est un super admin, ne pas lui montrer l'admin d'organisation
  // Il doit aller sur /super
  const isSuper = await isSuperAdmin();
  if (isSuper) {
    // Super admin : rediriger vers /super ou permettre les deux ?
    // Pour l'instant, on permet aux super admins d'accéder aussi à /admin
    // Mais on pourrait rediriger si nécessaire
  }

  // Vérifier que l'utilisateur est admin dans au moins une organisation
  const supabase = await getServerClient();
  if (!supabase) {
    console.error("[admin/layout] Supabase client not available");
    redirect("/dashboard");
  }

  try {
    console.log("[admin/layout] Checking admin role for user:", session.id);
    
    // Vérifier d'abord le rôle dans profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.id)
      .single();

    console.log("[admin/layout] Profile role:", profile?.role);

    // Si le rôle dans profiles est admin, autoriser l'accès
    if (profile?.role === "admin") {
      console.log("[admin/layout] User is admin in profiles, allowing access");
      // Continuer sans redirection
    } else {
      // Sinon, vérifier dans org_memberships
      const { data: memberships, error } = await supabase
        .from("org_memberships")
        .select("role, org_id")
        .eq("user_id", session.id)
        .eq("role", "admin");

      console.log("[admin/layout] Memberships with admin role:", memberships?.length || 0);

      if (error) {
        console.error("[admin/layout] Error checking memberships:", error);
      }

      if ((!memberships || memberships.length === 0) && profile?.role !== "admin") {
        // Pas admin d'organisation ni dans profiles, vérifier si super admin
        console.log("[admin/layout] User is not admin, checking if super admin");
        if (!isSuper) {
          console.log("[admin/layout] User is not admin and not super admin, redirecting to /dashboard");
          redirect("/dashboard");
        } else {
          console.log("[admin/layout] User is super admin, allowing access");
        }
      }
    }
  } catch (error) {
    console.error("[admin/layout] Error checking admin role:", error);
    if (!isSuper) {
      redirect("/dashboard");
    }
  }

  // Récupérer le logo de l'organisation
  let organizationLogo: string | null = null;
  try {
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", session.id)
      .eq("role", "admin")
      .limit(1)
      .single();
    
    if (membership?.org_id) {
      organizationLogo = await getOrganizationLogo(membership.org_id);
    }
  } catch (error) {
    console.error("[admin/layout] Error fetching organization logo:", error);
  }

  return (
    <AdminLayoutWrapper organizationLogo={organizationLogo}>
      {children}
    </AdminLayoutWrapper>
  );
}

