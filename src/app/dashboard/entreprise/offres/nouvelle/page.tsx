import { redirect } from "next/navigation";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NouvelleOffrePage() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) redirect("/login?from=entreprise");
  if (!("organizationId" in access)) redirect("/dashboard/entreprise/offres");

  const service = getServiceRoleClient();
  if (!service) redirect("/dashboard/entreprise/offres");

  const { data, error } = await service
    .from("job_offers")
    .insert({
      school_id: access.organizationId,
      title: "Sans titre",
      description: "",
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) redirect("/dashboard/entreprise/offres");
  redirect(`/dashboard/entreprise/offres/${data.id}/edition?step=1`);
}
