import { redirect } from "next/navigation";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

/** Redirige vers le builder formateur plein écran (org verrouillée). */
export default async function EntrepriseFormationsCreerPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string }>;
}) {
  const { orgId } = await requireEntrepriseOrgId("/dashboard/entreprise/formations/creer");
  const sp = (await searchParams) ?? {};
  const courseId = typeof sp.courseId === "string" ? sp.courseId.trim() : "";
  const params = new URLSearchParams({
    lockedOrgId: orgId,
    returnTo: "/dashboard/entreprise/formations/gerer",
    embed: "1",
  });
  if (courseId) params.set("courseId", courseId);
  redirect(`/dashboard/formateur/formations/new?${params.toString()}`);
}
