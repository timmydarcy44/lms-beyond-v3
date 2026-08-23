import { EcoleFormationsCreerClient } from "./creer-client";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EcoleFormationsCreerPage() {
  const { orgId } = await requireEcoleOrgId("/dashboard/ecole/formations/creer");
  return <EcoleFormationsCreerClient orgId={orgId} />;
}
