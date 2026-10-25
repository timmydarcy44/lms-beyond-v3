import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { FormationStudio } from "@/app/catalog/formations/[slug]/formation-studio";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { getSession } from "@/lib/auth/session";
import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { listSalarieAssignedFormations } from "@/lib/salarie/assigned-formations";
import type { CourseBuilderSnapshot } from "@/types/course-builder";

export const dynamic = "force-dynamic";

export default async function SalarieFormationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = decodeURIComponent(String(slug ?? "")).trim();
  const session = await getSession();
  if (!session?.id) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/salarie/formations/${key}`)}`);
  }

  const assigned = await listSalarieAssignedFormations(session.id, session.email);
  const row = assigned.find((item) => item.slug === key || item.id === key);
  if (!row) notFound();

  const loaded = await getLearnerContentDetail("formations", row.slug || row.id);
  if (!loaded) notFound();

  const info = loaded.detail as {
    title: string;
    description?: string;
    presentation?: string;
    backgroundImage?: string | null;
    skills?: string[];
    builder_snapshot?: CourseBuilderSnapshot | null;
    modules?: Array<{ lessons?: Array<{ id: string; progress?: number | null }> }>;
  };
  const courseSlug = loaded.card.slug || row.slug || key;
  const playBase = `/dashboard/salarie/formations/${encodeURIComponent(courseSlug)}`;
  const codeSource = courseSlug.split("-")[0] ?? "";
  const code = /^[a-z0-9]{2,10}$/i.test(codeSource) ? codeSource.toUpperCase() : (codeSource || "Formation").toUpperCase();
  const episodes = (info.modules ?? []).flatMap((module) =>
    (module.lessons ?? []).map((lesson) => ({ id: lesson.id, progress: lesson.progress ?? null })),
  );

  return (
    <LearningSessionTracker contentType="course" contentId={loaded.card.id} showIndicator={false}>
      <div className="min-h-screen bg-[#07080b] text-white">
        <DyslexiaModeProvider>
          <Suspense fallback={null}>
            <FormationStudio
              courseId={loaded.card.id}
              code={code}
              title={info.title}
              description={String(info.presentation || info.description || row.presentation || "")}
              cover={row.coverImage || info.backgroundImage || null}
              playBase={playBase}
              backHref="/dashboard/salarie/formations"
              snapshot={(info.builder_snapshot ?? null) as CourseBuilderSnapshot | null}
              skills={Array.isArray(info.skills) ? info.skills : []}
              episodes={episodes}
            />
          </Suspense>
        </DyslexiaModeProvider>
      </div>
    </LearningSessionTracker>
  );
}
