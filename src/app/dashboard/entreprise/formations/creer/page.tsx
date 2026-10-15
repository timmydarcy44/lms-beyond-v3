import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

/** Redirige vers le builder formateur plein écran (org verrouillée). */
export default async function EntrepriseFormationsCreerPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string }>;
}) {
  const session = await getSession();
  if (isJadeDemoEmail(session?.email)) {
    redirect("/dashboard/formateur/formations/new");
  }
  const { orgId } = await requireEntrepriseOrgId("/dashboard/entreprise/formations/creer");
  const sp = (await searchParams) ?? {};
  const courseId = typeof sp.courseId === "string" ? sp.courseId.trim() : "";
  const params = new URLSearchParams({
    lockedOrgId: orgId,
    returnTo: "/dashboard/entreprise/formations/catalogue",
    embed: "1",
  });
  if (courseId) params.set("courseId", courseId);
  redirect(`/dashboard/formateur/formations/new?${params.toString()}`);
}
