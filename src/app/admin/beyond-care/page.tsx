import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isUserAdminWithFeature } from "@/lib/queries/organization-features";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminBeyondCareDashboard } from "@/components/beyond-care/admin-beyond-care-dashboard";

export default async function AdminBeyondCarePage() {
  const session = await getSession();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Vérifier si l'utilisateur est admin dans au moins une organisation avec Beyond Care
  const isAdmin = await isUserAdminWithFeature("beyond_care");
  
  if (!isAdmin) {
    redirect("/admin");
  }

  return (
    <AdminPageScaffold
      title="Beyond Care"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Beyond Care" },
      ]}
    >
      <AdminBeyondCareDashboard />
    </AdminPageScaffold>
  );
}

