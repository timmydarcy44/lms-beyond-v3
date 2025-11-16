import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CourseMetadataWorkspaceSuperAdmin } from "@/components/super-admin/course-metadata-workspace-super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminNewModulePage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Créer un nouveau module
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Configurez les métadonnées de votre module (titre, description, visuels, etc.)
        </p>
      </div>
      <CourseMetadataWorkspaceSuperAdmin />
    </>
  );
}

