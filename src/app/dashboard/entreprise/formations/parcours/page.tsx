import { redirect } from "next/navigation";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

/** Redirige vers le builder parcours formateur plein écran (org verrouillée). */
export default async function EntrepriseFormationsParcoursPage() {
  const { orgId } = await requireEntrepriseOrgId("/dashboard/entreprise/formations/parcours");
  const params = new URLSearchParams({
    lockedOrgId: orgId,
    returnTo: "/dashboard/entreprise/formations/gerer",
  });
  redirect(`/dashboard/formateur/parcours/new?${params.toString()}`);
}
