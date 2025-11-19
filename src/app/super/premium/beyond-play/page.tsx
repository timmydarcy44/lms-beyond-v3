import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { BeyondPlayList } from "@/components/super-admin/beyond-play-list";

export default async function BeyondPlayPage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <SuperAdminShell
      title="Beyond Play"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Premium", href: "/super/premium" },
        { label: "Beyond Play" },
      ]}
    >
      <BeyondPlayList />
    </SuperAdminShell>
  );
}




