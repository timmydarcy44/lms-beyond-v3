import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";
import { requireEntrepriseOrgId } from "@/lib/org/require-dashboard-org";

export const dynamic = "force-dynamic";

export default async function EntrepriseFormationsCreerPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string }>;
}) {
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
