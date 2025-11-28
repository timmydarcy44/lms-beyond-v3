import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { BeyondConnectHeader } from "@/components/beyond-connect/beyond-connect-header";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isUserAdminWithFeature } from "@/lib/queries/organization-features";

export default async function BeyondConnectCompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/companies");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/companies");
  }

  // Vérifier que l'utilisateur est admin/instructor dans une organisation avec Beyond Connect
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.id)
    .single();

  // Vérifier le rôle - mais ne pas rediriger immédiatement si ce n'est pas admin/instructor
  // La vérification d'accès à Beyond Connect se fera ensuite
  if (!profile) {
    console.error("[beyond-connect-app/companies/layout] ❌ No profile found");
    redirect("/beyond-connect/login?next=/beyond-connect-app/companies");
  }
  
  // Si l'utilisateur n'est pas admin/instructor, rediriger vers l'app learner
  if (profile.role !== "admin" && profile.role !== "instructor") {
    console.log("[beyond-connect-app/companies/layout] User is not admin/instructor, redirecting to learner app");
    redirect("/beyond-connect-app");
  }

  // Vérifier que l'utilisateur a accès à Beyond Connect
  // Vérifier directement avec le service role client pour être sûr
  const supabaseService = getServiceRoleClient();
  if (supabaseService) {
    // Vérification directe avec service role
    const { data: memberships } = await supabaseService
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", session.id);

    if (memberships && memberships.length > 0) {
      const orgIds = memberships.map(m => m.org_id);
      const { data: features } = await supabaseService
        .from("organization_features")
        .select("org_id")
        .in("org_id", orgIds)
        .eq("feature_key", "beyond_connect")
        .eq("is_enabled", true);

      const orgsWithFeature = features?.map(f => f.org_id) || [];
      const hasAccessDirect = memberships.some(
        m => m.role === "admin" && orgsWithFeature.includes(m.org_id)
      );

      console.log("[beyond-connect-app/companies/layout] Direct check:", {
        userId: session.id,
        memberships: memberships.length,
        features: features?.length || 0,
        hasAccessDirect
      });

      if (hasAccessDirect) {
        console.log("[beyond-connect-app/companies/layout] ✅ Access granted (direct check)");
        // Continuer sans redirection
      } else {
        console.log("[beyond-connect-app/companies/layout] ❌ Access denied (direct check), redirecting");
        redirect("/beyond-connect?error=feature_not_enabled");
      }
    } else {
      console.log("[beyond-connect-app/companies/layout] ❌ No memberships found, redirecting");
      redirect("/beyond-connect?error=feature_not_enabled");
    }
  } else {
    // Fallback sur la fonction normale
    const hasAccess = await isUserAdminWithFeature("beyond_connect");
    
    console.log("[beyond-connect-app/companies/layout] Access check (fallback):", { 
      userId: session.id, 
      profileRole: profile?.role, 
      hasAccess 
    });
    
    if (!hasAccess) {
      console.log("[beyond-connect-app/companies/layout] ❌ Access denied, redirecting to landing");
      redirect("/beyond-connect?error=feature_not_enabled");
    }
    
    console.log("[beyond-connect-app/companies/layout] ✅ Access granted (fallback)");
  }

  // Ne pas ajouter de header ici - le layout parent le gère déjà
  // Mais on doit s'assurer que le header du layout parent ne s'affiche pas en double
  // Le header est géré par le layout parent /beyond-connect-app/layout.tsx
  // On retourne juste les children pour éviter le double header
  return <>{children}</>;
}

