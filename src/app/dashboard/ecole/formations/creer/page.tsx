import { redirect } from "next/navigation";
import { requireEcoleOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EcoleFormationsCreerPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string }>;
}) {
  const { orgId } = await requireEcoleOrgId("/dashboard/ecole/formations/creer");
  const sp = (await searchParams) ?? {};
  const courseId = typeof sp.courseId === "string" ? sp.courseId.trim() : "";
  const params = new URLSearchParams({
    lockedOrgId: orgId,
    returnTo: "/dashboard/ecole/formations/gerer",
    embed: "1",
  });
  if (courseId) params.set("courseId", courseId);
  redirect(`/dashboard/formateur/formations/new?${params.toString()}`);
}
