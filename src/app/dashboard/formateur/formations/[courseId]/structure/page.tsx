import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function FormateurCourseStructurePage({ params }: PageProps) {
  const { courseId } = await params;

  if (!courseId) {
    notFound();
  }

  // Vérifier que le cours existe et appartient au formateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) {
    notFound();
  }

  const superAdmin = await isSuperAdmin();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, creator_id, owner_id")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    notFound();
  }

  // Vérifier que l'utilisateur est propriétaire du cours
  if (!superAdmin && course.creator_id !== authData.user.id && course.owner_id !== authData.user.id) {
    notFound();
  }

  const snapshot = await getCourseBuilderSnapshot(courseId);
  // Si pas de snapshot, le composant utilisera l'état vide par défaut

  return (
    <DashboardShell
      title="Structure & modules"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Configuration" },
      ]}
      initialCollapsed
    >
      <CourseBuilderWorkspace
        initialData={snapshot || undefined}
        previewHref={`/dashboard/formateur/formations/${courseId}/preview`}
        courseId={courseId}
      />
    </DashboardShell>
  );
}



