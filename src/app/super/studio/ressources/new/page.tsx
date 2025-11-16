import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { ResourceCreateFormSuperAdmin } from "@/components/super-admin/resource-create-form-super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminNewRessourcePage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Créer une nouvelle ressource
          </h1>
          <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Configurez les métadonnées de votre ressource
          </p>
        </div>
        <ResourceCreateFormSuperAdmin />
    </main>
  );
}

