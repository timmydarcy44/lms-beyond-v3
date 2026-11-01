import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CompetencyManager } from "@/app/super/open-badges/competences/manager";

export default async function CompetenciesPage() {
  if (!(await isSuperAdmin())) redirect("/unauthorized");
  return (
    <SuperAdminShell title="Compétences" breadcrumbs={[{ label: "Super Admin", href: "/super" }, { label: "Open Badges", href: "/super/open-badges/badgeclasses" }, { label: "Compétences" }]}>
      <CompetencyManager />
    </SuperAdminShell>
  );
}
