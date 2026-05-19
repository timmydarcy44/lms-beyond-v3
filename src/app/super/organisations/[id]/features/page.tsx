import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { OrganizationFeaturesManager } from "@/components/super-admin/organization-features-manager";

export default async function OrganizationFeaturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const isSuper = await isSuperAdmin();
  let supabase = isSuper ? getServiceRoleClient() : await getServerClient();

  if (!supabase && isSuper) {
    supabase = await getServerClient();
  }

  if (!supabase) {
    redirect("/dashboard");
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (orgError || !organization) {
    redirect("/super/organisations");
  }

  return (
    <SuperAdminShell title={`Fonctionnalités • ${organization.name ?? ""}`}>
      <div className="space-y-6">
        <OrganizationFeaturesManager orgId={organization.id} organizationName={organization.name ?? ""} />
      </div>
    </SuperAdminShell>
  );
}

