import { Suspense } from "react";
import { notFound } from "next/navigation";

import { FormationStudio } from "@/app/catalog/formations/[slug]/formation-studio";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import type { CourseBuilderSnapshot } from "@/types/course-builder";

export const dynamic = "force-dynamic";

export default async function FormationTesterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await getLearnerContentDetail("formations", id);
  if (!loaded) notFound();
  const info = loaded.detail as {
    title: string;
    presentation?: string;
    description?: string;
    backgroundImage?: string | null;
    builder_snapshot?: CourseBuilderSnapshot | null;
    skills?: string[];
  };
  const base = `/super/lms/formations/${id}/tester`;
  const code = (loaded.card.title || "Formation").slice(0, 8).toUpperCase();

  return (
    <div className="learner-preview m-0 min-h-screen w-full bg-black p-0 text-white">
      <DyslexiaModeProvider>
        <Suspense fallback={null}>
          <FormationStudio
            preview
            courseId={loaded.card.id}
            code={code}
            title={info.title}
            description={String(info.presentation || info.description || "")}
            cover={info.backgroundImage || null}
            playBase={base}
            backHref={`/super/lms/formations/${id}`}
            snapshot={info.builder_snapshot ?? null}
            skills={Array.isArray(info.skills) ? info.skills : []}
          />
        </Suspense>
      </DyslexiaModeProvider>
    </div>
  );
}
