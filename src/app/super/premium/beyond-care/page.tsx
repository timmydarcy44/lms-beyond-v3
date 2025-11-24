import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { BeyondCareList } from "@/components/super-admin/beyond-care-list";

export default async function BeyondCarePage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <SuperAdminShell
      title="Beyond Care"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Premium", href: "/super/premium" },
        { label: "Beyond Care" },
      ]}
    >
      <BeyondCareList />
    </SuperAdminShell>
  );
}








