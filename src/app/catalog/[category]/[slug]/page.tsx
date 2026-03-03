import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { Button } from "@/components/ui/button";
import {
  getLearnerContentDetail,
  isLearnerCategory,
  type LearnerCategory,
  type LearnerLesson,
  type LearnerModule,
} from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";

const CATEGORY_LABEL: Record<LearnerCategory, string> = {
  formations: "Formation",
  parcours: "Parcours",
  ressources: "Ressource",
  tests: "Test",
};

interface LearnerDetailPageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export default async function LearnerDetailPage({ params }: LearnerDetailPageProps) {
  const { category: rawCategory, slug } = await params;

  if (!isLearnerCategory(rawCategory)) {
    notFound();
  }
  const category = rawCategory as LearnerCategory;

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

  // Déterminer le contentType pour le tracking
  const contentTypeMap: Record<LearnerCategory, "course" | "path" | "resource" | "test"> = {
    formations: "course",
    parcours: "path",
    ressources: "resource",
    tests: "test",
  };

  const contentType = contentTypeMap[category];

  const categoryReturnHref: Record<LearnerCategory, string> = {
    formations: "/dashboard/student/learning/formations",
    parcours: "/dashboard/student/learning/parcours",
    ressources: "/dashboard/ressources",
    tests: "/dashboard/student/learning/tests",
  };
  const returnHref = categoryReturnHref[category] ?? "/dashboard/apprenant";

  return (
    <LearningSessionTracker contentType={contentType} contentId={card.id} showIndicator={false}>
      <div className="min-h-screen bg-[#050505] text-white">
        <DashboardShell
          title={info.title}
          subtitle={info.subtitle ?? info.meta[0] ?? undefined}
          breadcrumbs={breadcrumbs}
          forcedTheme="dark"
          className="bg-[#050505] text-white"
          mainClassName="bg-transparent"
        >
          <section className="relative overflow-hidden rounded-[40px] border border-white/12 bg-white/5 shadow-[0_80px_140px_-80px_rgba(0,0,0,0.7)]">
            <div className="absolute inset-0">
              {info.backgroundImage && info.backgroundImage.trim() !== "" ? (
                <Image
                  src={info.backgroundImage}
                  alt={info.title}
                  fill
                  priority
                  className="object-cover object-center"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-black/92 via-black/70 to-black/40" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_55%)] mix-blend-screen" />
            </div>

            <div className="relative z-10 flex flex-col gap-10 px-6 py-12 md:px-12 md:py-16 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-6">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white/75 backdrop-blur">
                  {CATEGORY_LABEL[category]}
                </span>
                <div className="space-y-4">
                  <h1 className="text-[clamp(36px,5vw,68px)] font-semibold leading-tight drop-shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
                    {info.title}
                  </h1>
                  {info.subtitle ? (
                    <p className="text-base text-white/70 md:text-lg">{info.subtitle}</p>
                  ) : info.description ? (
                    <p className="text-base text-white/70 md:text-lg">{info.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/70 md:text-sm">
                  {info.meta.map((item) => (
                    <span key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/85 backdrop-blur">
                      {item}
                    </span>
                  ))}
                </div>
                {info.skills && info.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {info.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/75 backdrop-blur">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Button
                    asChild
                    className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 shadow-[0_20px_48px_-24px_rgba(255,255,255,0.85)] transition hover:bg-white/90"
                  >
                    <Link href={playHref}>Accéder</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white transition duration-200 hover:border-white/50 hover:bg-white/15"
                  >
                    <Link href={returnHref}>Retour au catalogue</Link>
                  </Button>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-4 rounded-[30px] border border-white/12 bg-white/10 p-6 text-white/75 backdrop-blur lg:max-w-xs">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">En un coup d&apos;œil</p>
                <div className="space-y-3 text-sm">
                  <p className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white/85">
                    {card.meta ?? "Disponible immédiatement"}
                  </p>
                  {info.objectives && info.objectives.length > 0 && (
                    <p className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white/80">
                      {info.objectives[0]}
                    </p>
                  )}
                  {info.badge?.description ? (
                    <p className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white/80">
                      {info.badge.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-8 rounded-[32px] border border-white/10 bg-white/5 px-6 py-10 md:grid-cols-[0.95fr,1.05fr] md:px-10 shadow-[0_55px_140px_-80px_rgba(0,0,0,0.6)]">
            <div className="space-y-8 text-white/80">
              {info.objectives && info.objectives.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">Objectifs pédagogiques</h2>
                  <ul className="space-y-3 text-sm text-white/75">
                    {info.objectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
                        <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-white/70" />
                        <span className="leading-relaxed text-white/80">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {info.badge ? (
                <div className="space-y-2 rounded-[28px] border border-white/12 bg-white/5 p-6">
                  <span className="text-xs uppercase tracking-[0.32em] text-white/55">Badge à obtenir</span>
                  <p className="text-lg font-semibold text-white">{info.badge.label}</p>
                  {info.badge.description ? (
                    <p className="text-sm text-white/70">{info.badge.description}</p>
                  ) : null}
                </div>
              ) : null}

              {info.skills && info.skills.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">Compétences développées</h3>
                  <div className="flex flex-wrap gap-2">
                    {info.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/85"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 rounded-[28px] border border-white/12 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Structure du programme</h2>
              {info.trailerUrl ? (
                <video controls poster={info.backgroundImage || undefined} className="h-52 w-full rounded-2xl border border-white/10 object-cover">
                  <source src={info.trailerUrl} type="video/mp4" />
                </video>
              ) : info.backgroundImage ? (
                <Image
                  src={info.backgroundImage}
                  alt={`${info.title} thumbnail`}
                  width={640}
                  height={360}
                  className="h-52 w-full rounded-2xl border border-white/10 object-cover"
                />
              ) : null}
              <ul className="space-y-4 text-sm text-white/80">
                {info.modules.map((module: LearnerModule) => (
                  <li
                    key={module.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-white/12 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{module.title}</p>
                      {module.description ? <p className="text-xs text-white/60">{module.description}</p> : null}
                    </div>
                    {module.length ? (
                      <span className="text-xs uppercase tracking-wide text-white/55">{module.length}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-4 rounded-[32px] border border-white/12 bg-white/5 p-6 md:p-8 shadow-[0_55px_140px_-90px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-semibold text-white">Sommaire détaillé</h2>
              <p className="text-sm text-white/60">
                Déployez chaque module pour accéder aux ressources et lancer une leçon.
              </p>
            </div>
            <div className="space-y-3">
              {info.modules.map((module, moduleIndex) => (
                <details
                  key={module.id}
                  className="group rounded-2xl border border-white/12 bg-white/5 p-4 transition hover:border-white/25"
                  open={moduleIndex === 0}
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-white">
                    <span>{module.title}</span>
                    {module.length ? (
                      <span className="text-xs uppercase tracking-wide text-white/55">{module.length}</span>
                    ) : null}
                  </summary>
                  {module.description ? <p className="mt-3 text-sm text-white/70">{module.description}</p> : null}
                  {module.lessons?.length ? (
                    <ul className="mt-4 space-y-2 text-sm text-white/80">
                      {module.lessons.map((lesson: LearnerLesson) => {
                        const lessonHref = `${card.href}/play/${lesson.id}`;
                        return (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <Link href={lessonHref} className="font-medium text-white transition hover:text-white/80">
                                {lesson.title}
                              </Link>
                              {lesson.description ? (
                                <span className="text-xs text-white/60">{lesson.description}</span>
                              ) : null}
                            </div>
                            {lesson.duration ? (
                              <span className="text-xs uppercase tracking-wide text-white/55">{lesson.duration}</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </details>
              ))}
            </div>
          </section>

          {related.length > 0 ? (
            <SectionSlider
              title="Vous aimerez aussi"
              cards={related.map((relatedCard) => ({
                ...relatedCard,
                cta: relatedCard.cta ?? undefined,
                meta: relatedCard.meta ?? undefined,
                progress: relatedCard.progress ?? undefined,
              }))}
              accent="learner"
              theme="dark"
              variant="compact"
            />
          ) : null}
        </DashboardShell>
      </div>
    </LearningSessionTracker>
  );
}


