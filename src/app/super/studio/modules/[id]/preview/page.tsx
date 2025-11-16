import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SuperAdminModulePreviewPage({ params }: PageProps) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { id: courseId } = await params;
  if (!courseId) {
    notFound();
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    notFound();
  }

  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .maybeSingle();

  if (error || !course) {
    notFound();
  }

  const snapshot = await getCourseBuilderSnapshot(courseId);
  if (!snapshot) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Vue apprenant</h1>
            <p className="text-sm text-white/70">
              Ce module n’a pas encore de contenu sauvegardé. Enregistrez la structure avant de prévisualiser.
            </p>
          </div>
          <Button asChild variant="secondary" className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:text-white">
            <Link href={`/super/studio/modules/${courseId}/structure`}>Revenir à l’éditeur</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Vue apprenant</h1>
          <p className="text-sm text-white/70">Prévisualisez ce module comme un apprenant le verrait.</p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:text-white"
        >
          <Link href={`/super/studio/modules/${courseId}/structure`}>Revenir à l’éditeur</Link>
        </Button>
      </div>

      <CourseLearnerPreview snapshot={snapshot} />
    </div>
  );
}



