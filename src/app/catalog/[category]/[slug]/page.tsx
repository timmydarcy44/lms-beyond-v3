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

  return (
    <LearningSessionTracker
      contentType={contentType}
      contentId={card.id}
      showIndicator={false}
    >
      <DashboardShell
        title={info.title}
        subtitle={info.subtitle ?? info.meta[0] ?? undefined}
        breadcrumbs={breadcrumbs}
        initialCollapsed
      >
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_40px_140px_rgba(249,115,22,0.25)]">
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(67,20,7,0.85),_transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-orange-900/40 to-black/75" />
        </div>

        <div className="relative z-10 flex flex-col gap-10 px-6 py-12 md:px-12 md:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-6 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
              {CATEGORY_LABEL[category]}
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight md:text-5xl">{info.title}</h1>
              {info.subtitle ? (
                <p className="text-sm text-white/75 md:text-base">{info.subtitle}</p>
              ) : null}
            </div>
            {info.badge ? (
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100 shadow-[0_8px_30px_rgba(251,191,36,0.25)]">
                🎖️ {info.badge.label}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 md:text-sm">
              {info.meta.map((item) => (
                <span key={item} className="rounded-full border border-white/30 px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
            {info.description && (
              <p className="max-w-2xl text-sm text-white/75 md:text-base">{info.description}</p>
            )}
            {info.skills && info.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {info.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Button asChild className="rounded-full bg-gradient-to-r from-white via-amber-100 to-orange-400 px-6 py-2 text-sm font-semibold text-black shadow-[0_16px_50px_rgba(249,115,22,0.35)] hover:from-white hover:via-white">
                <Link href={playHref}>Accéder au contenu</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-full border border-amber-200/70 bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Ajouter à ma liste
              </Button>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white/5 p-5 text-white/75 lg:max-w-xs">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">En un coup d&apos;œil</p>
            <div className="space-y-3 text-sm">
              <p className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white/80">
                {card.meta ?? "Disponible immédiatement"}
              </p>
              <p className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white/80">
                {info.objectives[0]}
              </p>
              {info.badge?.description ? (
                <p className="rounded-2xl border border-amber-200/30 bg-amber-500/10 px-4 py-3 text-amber-100">
                  {info.badge.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-white/10 bg-black/30 px-6 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-10">
        <div className="space-y-8">
          {info.objectives && info.objectives.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">Objectifs pédagogiques</h2>
              <ul className="space-y-3 text-sm text-white/75">
                {info.objectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-amber-400" />
                    <span className="leading-relaxed">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {info.badge ? (
            <div className="space-y-2 rounded-3xl border border-amber-200/30 bg-amber-500/10 p-5 text-white">
              <span className="text-xs uppercase tracking-[0.32em] text-amber-100/80">Badge à obtenir</span>
              <p className="text-lg font-semibold text-amber-50">{info.badge.label}</p>
              {info.badge.description ? (
                <p className="text-sm text-amber-100/80">{info.badge.description}</p>
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
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-white">Structure du programme</h2>
          {info.trailerUrl ? (
            <video controls poster={info.backgroundImage || undefined} className="h-52 w-full rounded-2xl object-cover">
              <source src={info.trailerUrl} type="video/mp4" />
            </video>
          ) : info.backgroundImage ? (
            <Image
              src={info.backgroundImage}
              alt={`${info.title} thumbnail`}
              width={640}
              height={360}
              className="h-52 w-full rounded-2xl object-cover"
            />
          ) : null}
          <ul className="space-y-4 text-sm text-white/80">
            {info.modules.map((module: LearnerModule) => (
              <li key={module.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{module.title}</p>
                  {module.description ? <p className="text-xs text-white/60">{module.description}</p> : null}
                </div>
                <span className="text-xs uppercase tracking-wide text-white/60">{module.length}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold text-white">Sommaire détaillé</h2>
          <p className="text-sm text-white/60">Déployez chaque module pour accéder aux ressources et lancer une leçon.</p>
        </div>
        <div className="space-y-3">
          {info.modules.map((module) => (
            <details
              key={module.id}
              className="group rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20"
              open={module === info.modules[0]}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-white/85">
                <span>{module.title}</span>
                <span className="text-xs uppercase tracking-wide text-white/50">{module.length}</span>
              </summary>
              {module.description ? <p className="mt-3 text-sm text-white/70">{module.description}</p> : null}
              {module.lessons?.length ? (
                <ul className="mt-4 space-y-2 text-sm text-white/80">
                  {module.lessons.map((lesson: LearnerLesson) => {
                    const lessonHref = `${card.href}/play/${lesson.id}`;
                    return (
                      <li key={lesson.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                        <div className="flex flex-col">
                          <Link href={lessonHref} className="font-medium text-white transition hover:text-white/90">
                            {lesson.title}
                          </Link>
                          {lesson.description ? (
                            <span className="text-xs text-white/60">{lesson.description}</span>
                          ) : null}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-white/50">{lesson.duration}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </details>
          ))}
        </div>
      </section>

      {related.length ? (
        <SectionSlider title="Vous aimerez aussi" cards={related} accent="learner" />
      ) : null}
    </DashboardShell>
    </LearningSessionTracker>
  );
}


