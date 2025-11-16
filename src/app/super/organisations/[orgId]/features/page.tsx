import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { OrganizationFeaturesManager } from "@/components/super-admin/organization-features-manager";

export default async function OrganizationFeaturesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  console.log("[features/page] Loading features page for orgId:", orgId);
  
  const hasAccess = await isSuperAdmin();
  console.log("[features/page] Has super admin access:", hasAccess);

  if (!hasAccess) {
    console.log("[features/page] No access, redirecting to /dashboard");
    redirect("/dashboard");
  }

  // Pour Super Admin, utiliser le service role client pour bypasser RLS
  const isSuper = await isSuperAdmin();
  let supabase = isSuper ? getServiceRoleClient() : await getServerClient();
  
  // Si service role client n'est pas disponible et qu'on est Super Admin, utiliser le client normal
  if (!supabase && isSuper) {
    console.warn("[features/page] Service role client non disponible, utilisation du client normal (RLS sera appliqué)");
    supabase = await getServerClient();
  }
  
  if (!supabase) {
    console.log("[features/page] No supabase client, redirecting to /dashboard");
    redirect("/dashboard");
  }

  // Récupérer les informations de l'organisation
  // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs si aucun résultat
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .maybeSingle();

  console.log("[features/page] Organization query result:", { 
    found: !!organization, 
    hasError: !!orgError,
    errorMessage: orgError?.message,
    errorCode: orgError?.code,
    orgId 
  });

  // Rediriger seulement si l'organisation n'existe vraiment pas
  // Ignorer orgError si c'est juste un objet vide
  if (!organization) {
    // Vérifier si c'est une vraie erreur avec un message ou un code
    const hasRealError = orgError && (orgError.message || orgError.code);
    if (hasRealError) {
      console.error("[features/page] Error fetching organization:", {
        message: orgError.message,
        code: orgError.code,
        details: orgError
      });
    } else {
      console.log("[features/page] Organization not found for orgId:", orgId);
    }
    redirect("/super/organisations");
  }

  console.log("[features/page] Rendering features page for:", organization.name);

  return (
    <SuperAdminShell
      title={`Fonctionnalités - ${organization.name}`}
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Organisations", href: "/super/organisations" },
        { label: organization.name, href: `/super/organisations/${orgId}` },
        { label: "Fonctionnalités" },
      ]}
    >
      <OrganizationFeaturesManager orgId={orgId} organizationName={organization.name} />
    </SuperAdminShell>
  );
}

