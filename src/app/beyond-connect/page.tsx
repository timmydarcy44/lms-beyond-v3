import { Metadata } from "next";
import { BeyondConnectLandingPage } from "@/components/beyond-connect/beyond-connect-landing-page";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Beyond Connect - Optimisation du recrutement | Beyond",
  description: "Trouvez votre stage, alternance, CDI ou CDD grâce à Beyond Connect. Système de matching intelligent pour optimiser vos chances de décrocher le poste idéal.",
};

function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Accès refusé</h3>
            <p className="text-sm text-red-700 mt-1">
              {error === "access_denied" 
                ? "Vous n'avez pas accès à Beyond Connect. Veuillez contacter votre administrateur pour activer cette fonctionnalité."
                : "Une erreur s'est produite lors de la connexion."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<BeyondConnectLandingPage />}>
      <ConnectPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ConnectPageContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error || null;
  
  // Si un utilisateur est connecté et qu'il y a une erreur, vérifier s'il a maintenant accès
  // Si oui, rediriger automatiquement vers l'application
  const session = await getSession();
  if (session && error) {
    const supabaseService = getServiceRoleClient();
    if (supabaseService) {
      // Vérifier l'accès
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
          m => (m.role === "admin" || m.role === "instructor") && orgsWithFeature.includes(m.org_id)
        ) || memberships.some(
          m => (m.role === "learner" || m.role === "student") && orgsWithFeature.includes(m.org_id)
        );

        if (hasAccess) {
          // L'utilisateur a accès, rediriger vers l'application
          const isAdmin = memberships.some(
            m => (m.role === "admin" || m.role === "instructor") && orgsWithFeature.includes(m.org_id)
          );
          
          if (isAdmin) {
            redirect("/beyond-connect-app/companies");
          } else {
            redirect("/beyond-connect-app");
          }
        }
      }
    }
  }
  
  return (
    <>
      <ErrorMessage error={error} />
      <BeyondConnectLandingPage />
    </>
  );
}
