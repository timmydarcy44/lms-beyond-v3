import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CatalogViewSuperAdmin } from "@/components/super-admin/catalog-view-super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminNoSchoolPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      {/* Vue catalogue avec gridview et filtres */}
      <CatalogViewSuperAdmin />
    </div>
  );
}

