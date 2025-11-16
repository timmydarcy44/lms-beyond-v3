import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";
import { Button } from "@/components/ui/button";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function FormateurCoursePreviewPage({ params }: PageProps) {
  const { courseId } = await params;

  if (!courseId) {
    notFound();
  }

  // Vérifier que le cours existe et appartient au formateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const serviceClient = await getServiceRoleClientOrFallback();

  const [{ data: authData }, { data: course, error: courseError }] = await Promise.all([
    supabase.auth.getUser(),
    serviceClient
      .from("courses")
      .select("id, title")
      .eq("id", courseId)
      .maybeSingle(),
  ]);

  if (!authData?.user?.id || courseError || !course) {
    notFound();
  }

  const snapshot = await getCourseBuilderSnapshot(courseId);

  if (!snapshot) {
    notFound();
  }

  return (
    <DashboardShell
      title="Vue apprenant"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Prévisualisation" },
      ]}
      initialCollapsed
    >
      <div className="space-y-6">
        <Button
          asChild
          variant="ghost"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:text-white"
        >
          <Link href={`/dashboard/formateur/formations/${courseId}/structure`}>Revenir au builder</Link>
        </Button>
        <CourseLearnerPreview snapshot={snapshot} />
      </div>
    </DashboardShell>
  );
}



