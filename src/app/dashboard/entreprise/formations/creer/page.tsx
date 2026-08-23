import { EntrepriseFormationsCreerClient } from "./creer-client";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EntrepriseFormationsCreerPage() {
  const { orgId } = await requireEntrepriseOrgId("/dashboard/entreprise/formations/creer");
  return <EntrepriseFormationsCreerClient orgId={orgId} />;
}
