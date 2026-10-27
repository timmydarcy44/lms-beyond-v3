import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";
import { getSession } from "@/lib/auth/session";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex min-h-screen bg-[#F4F4F1] text-[#07080B]">
      <EnterpriseSidebar />
      <main className="min-h-screen min-w-0 flex-1 lg:pl-[280px]">
        <FormateurFormationBuilderWhite
          initialCourseId={courseId || undefined}
          lockedOrgId={orgId}
          returnTo="/dashboard/entreprise/formations/gerer"
          embed
        />
      </main>
    </div>
  );
}
