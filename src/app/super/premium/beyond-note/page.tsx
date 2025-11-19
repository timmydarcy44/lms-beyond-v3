import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { BeyondNoteList } from "@/components/super-admin/beyond-note-list";

export default async function BeyondNotePage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <SuperAdminShell
      title="Beyond Note"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Premium", href: "/super/premium" },
        { label: "Beyond Note" },
      ]}
    >
      <BeyondNoteList />
    </SuperAdminShell>
  );
}




