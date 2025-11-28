import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { BeyondConnectList } from "@/components/super-admin/beyond-connect-list";

export default async function BeyondConnectPage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <SuperAdminShell
      title="Beyond Connect"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Premium", href: "/super/premium" },
        { label: "Beyond Connect" },
      ]}
    >
      <BeyondConnectList />
    </SuperAdminShell>
  );
}

