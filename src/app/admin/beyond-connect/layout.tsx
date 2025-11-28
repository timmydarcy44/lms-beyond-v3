import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isUserAdminWithFeature } from "@/lib/queries/organization-features";

export default async function BeyondConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Vérification directe avec service role client
  const supabaseService = getServiceRoleClient();
  if (supabaseService) {
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
      const isAdmin = memberships.some(
        m => m.role === "admin" && orgsWithFeature.includes(m.org_id)
      );

      console.log("[admin/beyond-connect/layout] Direct check:", {
        userId: session.id,
        isAdmin,
        memberships: memberships.length,
        features: features?.length || 0
      });

      if (!isAdmin) {
        redirect("/admin");
      }
    } else {
      redirect("/admin");
    }
  } else {
    // Fallback
    const isAdmin = await isUserAdminWithFeature("beyond_connect");
    if (!isAdmin) {
      redirect("/admin");
    }
  }

  // Retourner les enfants sans wrapper pour éviter le layout admin
  return <>{children}</>;
}

