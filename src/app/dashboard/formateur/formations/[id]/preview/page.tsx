import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseLearnerPreview } from "@/components/formateur/course-builder/course-learner-preview";
import { Button } from "@/components/ui/button";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FormateurCoursePreviewPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Vérifier que le cours existe et appartient au formateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const serviceClient = await getServiceRoleClientOrFallback();
  if (!serviceClient) {
    notFound();
  }

  const [{ data: authData }, { data: course, error: courseError }] = await Promise.all([
    supabase.auth.getUser(),
    serviceClient.from("courses").select("id, title").eq("id", id).maybeSingle(),
  ]);

  if (!authData?.user?.id || courseError || !course) {
    notFound();
  }

  const snapshot = await getCourseBuilderSnapshot(courseId);
  if (!snapshot) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="px-6 py-6">
        <Button
          asChild
          variant="ghost"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:text-white"
        >
                      <Link href={`/dashboard/formateur/formations/${id}`}>Revenir au builder</Link>
        </Button>
      </div>
      <div className="px-6 pb-10">
        <CourseLearnerPreview snapshot={snapshot} />
      </div>
    </div>
  );
}

