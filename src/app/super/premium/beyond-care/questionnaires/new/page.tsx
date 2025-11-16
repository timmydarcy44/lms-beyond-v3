import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { MentalHealthQuestionnaireBuilder } from "@/components/super-admin/mental-health-questionnaire-builder";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export default async function NewQuestionnairePage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Pour l'instant, on utilise la première organisation disponible
  // Dans un vrai cas, on devrait permettre de sélectionner l'organisation
  const isSuper = await isSuperAdmin();
  const supabase = isSuper ? getServiceRoleClient() : await getServerClient();
  
  let defaultOrgId = null;
  if (supabase) {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();
    
    if (orgs) {
      defaultOrgId = orgs.id;
    }
  }

  return (
    <SuperAdminShell
      title="Intégrer un questionnaire"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Premium", href: "/super/premium" },
        { label: "Beyond Care", href: "/super/premium/beyond-care" },
        { label: "Importer un questionnaire" },
      ]}
    >
      {defaultOrgId ? (
        <MentalHealthQuestionnaireBuilder orgId={defaultOrgId} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Aucune organisation trouvée. Veuillez créer une organisation d'abord.</p>
        </div>
      )}
    </SuperAdminShell>
  );
}


