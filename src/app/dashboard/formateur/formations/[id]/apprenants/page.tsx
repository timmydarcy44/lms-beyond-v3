import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CourseLearnersManager } from "@/components/formateur/course-learners-manager";
import { getCourseEnrollments, getFormateurGroups, getFormateurLearners } from "@/lib/queries/formateur";
import { getServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FormateurCourseLearnersPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
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

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, creator_id, owner_id")
    .eq("id", id)
    .single();

  if (courseError || !course) {
    notFound();
  }

  // Vérifier que l'utilisateur est propriétaire du cours
  if (course.creator_id !== authData.user.id && course.owner_id !== authData.user.id) {
    notFound();
  }

  const [learners, groups, enrollments] = await Promise.all([
    getFormateurLearners(),
    getFormateurGroups(),
    getCourseEnrollments(id),
  ]);

  return (
    <DashboardShell
      title={`Apprenants - ${course.title}`}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Apprenants" },
      ]}
    >
      <CourseLearnersManager
        courseId={id}
        courseTitle={course.title ?? "Formation"}
        learners={learners}
        groups={groups}
        currentEnrollments={enrollments.map((e) => e.user_id)}
      />
    </DashboardShell>
  );
}

