import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CourseBuilderWorkspaceSuperAdmin } from "@/components/super-admin/course-builder-workspace-super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ courseId?: string }>;
};

export default async function SuperAdminNewModuleStructurePage({ searchParams }: Props) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const courseId = params.courseId;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Structure & modules
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Construisez la structure de votre module : sections, chapitres et contenus pédagogiques.
        </p>
      </div>
      <CourseBuilderWorkspaceSuperAdmin previewHref="/super/studio/modules/new/preview" initialCourseId={courseId} />
    </>
  );
}

