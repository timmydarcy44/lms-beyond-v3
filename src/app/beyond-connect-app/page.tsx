import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BeyondConnectPageContent } from "@/components/beyond-connect/beyond-connect-page";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Beyond Connect - Votre CV numérique",
  description: "Gérez votre CV numérique, vos compétences et trouvez des opportunités professionnelles.",
};

export default async function BeyondConnectAppPage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app");
  }

  // Si l'utilisateur est admin/instructor avec accès, rediriger vers /companies
  const supabase = await getServerClient();
  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, first_name, last_name")
      .eq("id", session.id)
      .single();

    if (profile && (profile.role === "admin" || profile.role === "instructor")) {
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
          const hasAccess = memberships.some(
            m => m.role === "admin" && orgsWithFeature.includes(m.org_id)
          );

          if (hasAccess) {
            redirect("/beyond-connect-app/companies");
          }
        }
      }
    }

    // Pour les candidats (learner/student), vérifier si le profil est complet
    // Si first_name ou last_name manquent, rediriger vers l'onboarding
    if (profile && (profile.role === "learner" || profile.role === "student")) {
      if (!profile.first_name || !profile.last_name) {
        redirect("/beyond-connect-app/onboarding");
      }
    }
  }

  return <BeyondConnectPageContent userId={session.id} />;
}

