import { notFound } from "next/navigation";
import {
  getLearnerContentDetail,
  isLearnerCategory,
  type LearnerCategory,
} from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import Image from "next/image";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { Button } from "@/components/ui/button";

const CATEGORY_LABEL: Record<LearnerCategory, string> = {
  formations: "Formation",
  parcours: "Parcours",
  ressources: "Ressource",
  tests: "Test",
};

/**
 * Page spécifique pour les formations
 * Réutilise la même logique que /catalog/[category]/[slug]
 */
export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category: LearnerCategory = "formations";

  const detail = await getLearnerContentDetail(category, slug);
  if (!detail) {
    notFound();
  }

  const { card, detail: info, related = [] } = detail;
  const lessons = info.modules.flatMap((module) => module.lessons ?? []);
  const firstLesson = lessons[0];
  const playHref = firstLesson ? `${card.href}/play/${firstLesson.id}` : card.href;

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard/apprenant" },
    { label: CATEGORY_LABEL[category] },
    { label: info.title },
  ];

  const contentType = "course";

  return (
    <LearningSessionTracker
      contentType={contentType}
      contentId={card.id}
      contentTitle={info.title}
    >
      <DashboardShell
        title={info.title}
        breadcrumbs={breadcrumbs}
        className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A]"
      >
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_40px_140px_rgba(221,36,118,0.35)]">
          <div className="absolute inset-0">
            {info.backgroundImage && info.backgroundImage.trim() !== "" ? (
              <Image
                src={info.backgroundImage}
                alt={info.title}
                fill
                priority
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(128,26,70,0.85),_transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-[#FF512F]/35 to-[#DD2476]/55" />
          </div>

          <div className="relative z-10 flex flex-col gap-8 px-6 py-10 md:px-12 md:py-16">
            <div className="space-y-4 text-white md:max-w-3xl">
              {info.badge ? (
                <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                  {info.badge.label}
                </span>
              ) : null}
              <h1 className="text-3xl font-semibold leading-tight md:text-5xl">{info.title}</h1>
              {info.description ? (
                <p className="text-sm text-white/75 md:text-base">{info.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/70 md:text-sm">
                {info.meta.map((meta, index) => (
                  <span key={index} className="rounded-full border border-white/30 px-3 py-1 text-white/85">
                    {meta}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  asChild
                  className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF512F,#DD2476)] px-6 py-2 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(221,36,118,0.35)] hover:brightness-110"
                >
                  <Link href={playHref}>Démarrer</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Modules et Lessons */}
        {info.modules && info.modules.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Programme</h2>
            <div className="space-y-4">
              {info.modules.map((module: any) => (
                <div key={module.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-xl font-semibold text-white">{module.title}</h3>
                  {module.lessons && module.lessons.length > 0 && (
                    <div className="space-y-2">
                      {module.lessons.map((lesson: any) => (
                        <Link
                          key={lesson.id}
                          href={`${card.href}/play/${lesson.id}`}
                          className="block rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                        >
                          <p className="font-medium text-white">{lesson.title}</p>
                          {lesson.summary && (
                            <p className="mt-1 text-sm text-white/60">{lesson.summary}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contenu similaire */}
        {related.length > 0 && (
          <SectionSlider title="Vous aimerez aussi" cards={related} accent="learner" />
        )}
      </DashboardShell>
    </LearningSessionTracker>
  );
}


