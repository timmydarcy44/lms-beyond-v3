import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";

export default async function SuperAdminNewModuleStructurePage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Structure & modules
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Construisez la structure de votre module avec sections, chapitres et sous-chapitres
        </p>
      </div>
      <CourseBuilderWorkspace previewHref="/super/studio/modules/new/preview" />
    </main>
  );
}
