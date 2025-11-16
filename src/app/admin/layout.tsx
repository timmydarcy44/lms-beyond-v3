import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { AdminSidebarWrapper } from "@/components/admin/AdminSidebarWrapper";
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
    <div className="flex min-h-screen overflow-x-hidden relative" style={{ backgroundColor: 'transparent' }}>
      {/* Fond avec gradient bleu et formes abstraites - appliqué partout */}
      <div className="fixed inset-0 -z-10" style={{
        background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 30%, #0f172a 60%, #0a0f1a 100%)',
      }} />
      {/* Formes abstraites - cercles dégradés avec blur */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
      }} />
      <div className="fixed top-1/3 left-0 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
      }} />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-12 blur-2xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
      }} />
      <div className="fixed bottom-1/3 left-1/4 w-[350px] h-[350px] rounded-full opacity-10 blur-2xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
      }} />
      {/* Formes géométriques subtiles */}
      <div className="fixed top-0 left-0 w-64 h-64 opacity-5 -z-10" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
      }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 opacity-4 -z-10" style={{
        background: 'linear-gradient(45deg, transparent 0%, rgba(139, 92, 246, 0.08) 100%)',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      }} />
      
      <AdminSidebarWrapper organizationLogo={organizationLogo} />
      <main className="flex-1 transition-[margin-left] duration-300 ease-in-out relative z-10 overflow-x-hidden w-full" style={{ marginLeft: 'var(--sidebar-width, 272px)' }}>
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

