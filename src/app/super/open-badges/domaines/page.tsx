import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { DomainManager } from "@/app/super/open-badges/domaines/manager";

export default async function DomainsPage() {
  if (!(await isSuperAdmin())) redirect("/unauthorized");
  return (
    <SuperAdminShell title="Domaines" breadcrumbs={[{ label: "Super Admin", href: "/super" }, { label: "Open Badges", href: "/super/open-badges/badgeclasses" }, { label: "Domaines" }]}>
      <DomainManager />
    </SuperAdminShell>
  );
}
