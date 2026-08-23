import { redirect } from "next/navigation";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EcoleFormationsParcoursPage() {
  const { orgId } = await requireEcoleOrgId("/dashboard/ecole/formations/parcours");
  const params = new URLSearchParams({
    lockedOrgId: orgId,
    returnTo: "/dashboard/ecole/formations/gerer",
  });
  redirect(`/dashboard/formateur/parcours/new?${params.toString()}`);
}
