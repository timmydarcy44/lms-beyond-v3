import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";

export default async function SuperAdminFormationPreviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { courseId } = await params;

  const supabase = await getServerClient();
  if (!supabase) {
    return null;
  }

  const { data: course } = await supabase
    .from("courses")
    .select("builder_snapshot")
    .eq("id", courseId)
    .single();

  if (!course?.builder_snapshot) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-600">
          Formation non trouvée ou sans contenu
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Aperçu de la formation
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Visualisez votre formation telle qu&apos;elle apparaîtra aux apprenants
        </p>
      </div>
      <CourseLearnerPreview snapshot={course.builder_snapshot as any} />
    </main>
  );
}

