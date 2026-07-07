"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import { catalogModuleToCourseRow, enrichCoursePublic } from "@/lib/training-courses/catalog-fallback";
import {
  Accessibility,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  LifeBuoy,
  MapPin,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import {
  buildTrainingCourseDetail,
  formatInterPrice,
  formatIntraPrice,
  isBlockVisible,
  type TrainingCourseDetail,
} from "@/lib/training-courses/build-detail";
import {
  AFTER_TRAINING_STEPS,
  buildEvaluationModalities,
  buildPedagogicalMethods,
  buildPedagogicalObjectives,
  buildQualiopiInfo,
  buildQualityIndicators,
  buildSkillLevelRows,
  DIAGNOSTIC_STEPS,
  enrichInstructors,
  HERO_DIAGNOSTIC_BADGES,
} from "@/lib/training-courses/qualiopi-content";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";

const NAV_SECTIONS = [
  { id: "diagnostic", label: "Diagnostic" },
  { id: "presentation", label: "Présentation" },
  { id: "programme", label: "Programme" },
  { id: "competences", label: "Compétences" },
  { id: "informations", label: "Informations" },
  { id: "intervenants", label: "Intervenants" },
  { id: "qualite", label: "Qualité" },
] as const;

type BadgeMeta = { name?: string | null; imageUrl?: string | null };

type Props = {
  course: TrainingCoursePublic;
  badgeMeta?: BadgeMeta | null;
};

function TrainingSectionNav({ items }: { items: { id: string; label: string }[] }) {
  if (!items.length) return null;

  return (
    <div className="sticky top-[6.25rem] z-40 border-b border-[#050505]/8 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
        {/* Mobile : menu déroulant */}
        <div className="relative lg:hidden">
          <select
            className="w-full appearance-none rounded-xl border border-[#050505]/10 bg-[#F7F7F5] px-4 py-3 pr-10 text-sm font-medium text-[#050505] outline-none focus:border-edge-accent/40"
            defaultValue={items[0]?.id}
            onChange={(e) => {
              const el = document.getElementById(e.target.value);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#050505]/40" />
        </div>

        {/* Desktop : onglets équilibrés, sans scroll horizontal */}
        <nav
          className="hidden lg:grid"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          aria-label="Sections de la formation"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="py-2 text-center text-sm font-medium text-[#050505]/55 transition-colors hover:text-edge-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

function PricingCards({
  course,
  detail,
  conseillerHref,
  demoHref,
  compact,
}: {
  course: TrainingCoursePublic;
  detail: TrainingCourseDetail;
  conseillerHref: string;
  demoHref: string;
  compact?: boolean;
}) {
  const interPrice = formatInterPrice(course);
  const intraPrice = formatIntraPrice(course);

  return (
    <div className={cn("space-y-4", compact ? "" : "mt-6")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/45">Inter-entreprises</p>
          <p className="mt-2 text-base font-semibold">{interPrice}</p>
          <p className="mt-1 text-xs text-[#050505]/50">Par participant</p>
        </div>
        <div className="rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/45">Intra-entreprise</p>
          <p className="mt-2 text-base font-semibold">{intraPrice}</p>
          <p className="mt-1 text-xs text-[#050505]/50">Jusqu&apos;à {detail.maxIntraParticipants} participants</p>
        </div>
      </div>
      {!compact ? (
        <div className="flex flex-col gap-2.5">
          <EdgePremiumButton href={demoHref} shape="revolut" className="w-full">
            Commencer par un diagnostic EDGE
          </EdgePremiumButton>
          <EdgePremiumButton href={conseillerHref} variant="secondary-light" shape="revolut" className="w-full">
            Réserver cette formation
          </EdgePremiumButton>
        </div>
      ) : null}
    </div>
  );
}

function PricingSidebar({
  course,
  detail,
  demoHref,
  conseillerHref,
}: {
  course: TrainingCoursePublic;
  detail: TrainingCourseDetail;
  demoHref: string;
  conseillerHref: string;
}) {
  return (
    <aside className="sticky top-[9.5rem]">
      <div className="rounded-[24px] border border-[#050505]/8 bg-white p-6 shadow-[0_8px_32px_rgba(5,5,5,0.06)]">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Tarifs</h2>
        <PricingCards course={course} detail={detail} conseillerHref={conseillerHref} demoHref={demoHref} />
        <div className="mt-5 space-y-2 border-t border-[#050505]/8 pt-4 text-xs text-[#050505]/50">
          {course.duration ? (
            <p className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-edge-accent" />
              {course.duration}
            </p>
          ) : null}
          {detail.badgeLabel ? (
            <p className="flex items-center gap-2">
              <Award className="h-3.5 w-3.5 text-edge-accent" />
              {detail.badgeLabel}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

/** Frise verticale premium (diagnostic / après-formation). */
function VerticalTimeline({
  steps,
  accent = true,
}: {
  steps: { title: string; description: string }[];
  accent?: boolean;
}) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[15px] top-8 h-full w-px bg-[#050505]/10"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                accent
                  ? "bg-edge-accent/10 text-edge-accent"
                  : "bg-[#050505]/5 text-[#050505]/60",
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p className="font-medium text-[#050505]">{step.title}</p>
              <p className="mt-0.5 text-sm text-[#050505]/55">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StarRating({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Niveau attendu ${level} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < level ? "fill-edge-accent text-edge-accent" : "text-[#050505]/15",
          )}
        />
      ))}
    </span>
  );
}

export function EdgeTrainingDetailPage({ course, badgeMeta }: Props) {
  const { links } = useEdgePremiumConfig();
  const detail = useMemo(
    () => buildTrainingCourseDetail(course, badgeMeta ?? undefined),
    [course, badgeMeta],
  );
  const catalogHref = edgeMarketingHref("/business/former-vos-equipes");
  const leadTrainer = detail.trainers.find((t) => t.role === "primary") ?? detail.trainers[0];
  const heroImage = course.cover_url;
  const showPricing = isBlockVisible(detail, "pricing");

  const pedagogicalObjectives = useMemo(() => buildPedagogicalObjectives(detail), [detail]);
  const skillRows = useMemo(() => buildSkillLevelRows(detail), [detail]);
  const evaluationModalities = useMemo(() => buildEvaluationModalities(), []);
  const pedagogicalMethods = useMemo(() => buildPedagogicalMethods(detail), [detail]);
  const qualiopiInfo = useMemo(() => buildQualiopiInfo(course, detail), [course, detail]);
  const qualityIndicators = useMemo(() => buildQualityIndicators(), []);
  const enrichedTrainers = useMemo(() => enrichInstructors(detail, course), [detail, course]);

  const navItems = NAV_SECTIONS.map((s) => ({ id: s.id, label: s.label }));

  return (
    <div className="bg-[#F7F7F5] text-[#050505]">
      {/* 1. HERO */}
      <section className="relative overflow-hidden bg-[#050505] px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        {heroImage ? (
          <div className="absolute inset-0">
            <Image src={heroImage} alt="" fill className="object-cover opacity-45" unoptimized priority />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/92 to-[#050505]/55" />
          </div>
        ) : null}
        <div className="relative mx-auto max-w-6xl">
          <Link href={catalogHref} className="text-xs font-medium text-white/50 hover:text-white">
            ← Retour au catalogue
          </Link>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              {course.domain ? (
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent-light">
                  {course.domain}
                </p>
              ) : null}
              <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                {course.title}
              </h1>
              {detail.benefit ? (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{detail.benefit}</p>
              ) : null}

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
                Avant toute formation, nous réalisons un diagnostic complet des compétences afin de
                construire un parcours réellement adapté à vos collaborateurs.
              </p>

              <p className="mt-4 text-sm text-white/45">
                {[course.duration, course.level, detail.formatsLabel].filter(Boolean).join(" · ")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <EdgePremiumButton href={links.demo} variant="white" shape="revolut">
                  Commencer par un diagnostic EDGE
                </EdgePremiumButton>
                <EdgePremiumButton href={links.conseiller} variant="outline-white" shape="revolut">
                  Réserver cette formation
                </EdgePremiumButton>
              </div>

              <ul className="mt-6 flex flex-wrap gap-2">
                {HERO_DIAGNOSTIC_BADGES.map((badge) => (
                  <li
                    key={badge}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-edge-accent-light" />
                    {badge}
                  </li>
                ))}
              </ul>
            </div>
            {leadTrainer ? (
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  {leadTrainer.photoUrl ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                      <Image src={leadTrainer.photoUrl} alt={leadTrainer.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs text-white/50">Intervenant principal</p>
                    <p className="font-semibold text-white">{leadTrainer.name}</p>
                    <p className="text-sm text-white/60">{leadTrainer.specialty}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <TrainingSectionNav items={navItems} />

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_300px] lg:px-10 lg:py-16">
        <div className="min-w-0 space-y-20">
          {/* 2. POURQUOI CETTE FORMATION ? */}
          <section className="scroll-mt-40">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Pourquoi cette formation ?</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#050505]/65">
              Cette formation répond à des besoins opérationnels identifiés grâce au diagnostic EDGE.
              Elle vise à développer les compétences réellement nécessaires à la performance du
              collaborateur et de l&apos;entreprise.
            </p>
          </section>

          {/* 3. DIAGNOSTIC EDGE — pièce maîtresse */}
          <section id="diagnostic" className="scroll-mt-40">
            <div className="overflow-hidden rounded-[28px] border border-edge-accent/15 bg-gradient-to-br from-edge-accent/[0.07] via-white to-white p-7 shadow-[0_12px_48px_rgba(99,91,255,0.10)] sm:p-9">
              <div className="flex items-center gap-2 text-edge-accent">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Diagnostic EDGE</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-[1.75rem]">
                Chaque parcours débute par un diagnostic
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#050505]/60">
                Contrairement aux catalogues traditionnels, EDGE identifie précisément les compétences à
                développer avant toute inscription afin de proposer uniquement les formations réellement
                utiles.
              </p>
              <div className="mt-8 max-w-xl">
                <VerticalTimeline steps={DIAGNOSTIC_STEPS} />
              </div>
              <div className="mt-8">
                <EdgePremiumButton href={links.demo} shape="revolut">
                  Commencer par un diagnostic EDGE
                </EdgePremiumButton>
              </div>
            </div>
          </section>

          {/* PRÉSENTATION */}
          {isBlockVisible(detail, "presentation") && course.long_description ? (
            <section id="presentation" className="scroll-mt-40 space-y-10">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Présentation</h2>
              <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-[#050505]/65">
                {course.long_description}
              </p>

              {isBlockVisible(detail, "why_choose") && detail.whyFollow.length > 0 ? (
                <div className="rounded-[24px] border border-[#050505]/8 bg-white p-7">
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">Pourquoi choisir cette formation</h3>
                  <ul className="mt-5 space-y-3">
                    {detail.whyFollow.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#050505]/65">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* 4. OBJECTIFS PÉDAGOGIQUES — deux colonnes */}
          {pedagogicalObjectives.objectives.length > 0 ? (
            <section className="scroll-mt-40">
              <div className="grid gap-8 md:grid-cols-[0.4fr_0.6fr]">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Objectifs pédagogiques</h2>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#050505]/70">{pedagogicalObjectives.intro}</p>
                  <ul className="mt-4 space-y-3">
                    {pedagogicalObjectives.objectives.map((o) => (
                      <li key={o} className="flex gap-3 text-sm leading-relaxed text-[#050505]/65">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {/* PROGRAMME */}
          {isBlockVisible(detail, "program") && detail.programSections.length > 0 ? (
            <section id="programme" className="scroll-mt-40 space-y-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Programme</h2>
              <div className="space-y-8">
                {detail.programSections.map((section) => (
                  <div key={section.id}>
                    <h4 className="font-semibold text-[#050505]">{section.title}</h4>
                    {section.description ? (
                      <p className="mt-2 text-sm text-[#050505]/55">{section.description}</p>
                    ) : null}
                    <div className="mt-4 space-y-3">
                      {section.chapters.map((chapter, ci) => (
                        <div key={chapter.id} className="rounded-[20px] border border-[#050505]/8 bg-white p-5">
                          <div className="flex gap-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-edge-accent/10 text-sm font-semibold text-edge-accent">
                              {ci + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{chapter.title}</p>
                              {chapter.subchapters.length ? (
                                <ul className="mt-3 space-y-1.5 border-l border-[#050505]/10 pl-4">
                                  {chapter.subchapters.map((sub) => (
                                    <li key={sub.id} className="text-sm text-[#050505]/55">
                                      {sub.title}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 5. COMPÉTENCES DÉVELOPPÉES — tableau */}
          {skillRows.length > 0 ? (
            <section id="competences" className="scroll-mt-40 space-y-6">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Compétences développées</h2>

              {/* Desktop : tableau */}
              <div className="hidden overflow-hidden rounded-[24px] border border-[#050505]/8 bg-white sm:block">
                <div className="grid grid-cols-[1.6fr_1fr_1.2fr_1fr] gap-4 border-b border-[#050505]/8 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#050505]/40">
                  <span>Compétence</span>
                  <span>Niveau attendu</span>
                  <span>Évaluation</span>
                  <span>Certification</span>
                </div>
                {skillRows.map((row) => (
                  <div
                    key={row.skill}
                    className="grid grid-cols-[1.6fr_1fr_1.2fr_1fr] items-center gap-4 border-b border-[#050505]/5 px-6 py-4 last:border-0"
                  >
                    <span className="text-sm font-medium">{row.skill}</span>
                    <StarRating level={row.level} />
                    <span className="text-sm text-[#050505]/60">{row.evaluation}</span>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-edge-accent/10 px-2.5 py-1 text-xs font-medium text-edge-accent">
                      <Award className="h-3.5 w-3.5" />
                      {row.certification}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mobile : cartes */}
              <div className="space-y-3 sm:hidden">
                {skillRows.map((row) => (
                  <div key={row.skill} className="rounded-[20px] border border-[#050505]/8 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{row.skill}</span>
                      <StarRating level={row.level} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#050505]/55">
                      <span>{row.evaluation}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-edge-accent/10 px-2 py-0.5 font-medium text-edge-accent">
                        <Award className="h-3 w-3" />
                        {row.certification}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 6. MODALITÉS D'ÉVALUATION */}
          <section className="scroll-mt-40">
            <div className="rounded-[24px] border border-[#050505]/8 bg-white p-7">
              <div className="flex items-center gap-2 text-edge-accent">
                <Target className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">Évaluation</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">Modalités d&apos;évaluation</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {evaluationModalities.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-[#050505]/65">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 7. MÉTHODES PÉDAGOGIQUES */}
          <section className="scroll-mt-40">
            <div className="rounded-[24px] border border-edge-accent/15 bg-gradient-to-br from-edge-accent/[0.06] to-white p-7">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Méthodes pédagogiques</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {pedagogicalMethods.map((method) => (
                  <span
                    key={method}
                    className="rounded-full border border-edge-accent/20 bg-white px-3 py-1.5 text-xs font-medium text-edge-accent"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* 8. ACCOMPAGNEMENT */}
          <section className="scroll-mt-40">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Vous n&apos;êtes jamais seul.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[#050505]/8 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-edge-accent/10 text-edge-accent">
                  <Target className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Avant</p>
                <p className="mt-1 font-medium">Diagnostic</p>
                <p className="mt-1 text-sm text-[#050505]/55">Identification précise des besoins.</p>
              </div>
              <div className="rounded-[24px] border border-[#050505]/8 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-edge-accent/10 text-edge-accent">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Pendant</p>
                <p className="mt-1 font-medium">Suivi pédagogique</p>
                <p className="mt-1 text-sm text-[#050505]/55">Un accompagnement à chaque étape.</p>
              </div>
              <div className="rounded-[24px] border border-[#050505]/8 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-edge-accent/10 text-edge-accent">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Après</p>
                <p className="mt-1 font-medium">Plan de progression</p>
                <ul className="mt-2 space-y-1 text-sm text-[#050505]/55">
                  <li>Accès aux ressources</li>
                  <li>Coaching possible</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 9. INFORMATIONS — Qualiopi */}
          <section id="informations" className="scroll-mt-40 space-y-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Informations</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {qualiopiInfo.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[20px] border border-[#050505]/8 bg-white p-5",
                    item.wide ? "sm:col-span-2" : "",
                  )}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#050505]/40">
                    {item.label === "Accessibilité handicap" || item.label === "Référent handicap" ? (
                      <Accessibility className="h-3.5 w-3.5 text-edge-accent" />
                    ) : null}
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-[#050505]/70">{item.value}</p>
                </div>
              ))}

              {isBlockVisible(detail, "open_badge") && detail.badgeLabel ? (
                <div className="rounded-[20px] border border-[#050505]/8 bg-white p-5 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">
                    Certification &amp; Open Badge
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    {detail.badgeImageUrl ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                        <Image src={detail.badgeImageUrl} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <Award className="h-8 w-8 text-edge-accent" />
                    )}
                    <div>
                      <p className="font-semibold">{detail.badgeLabel}</p>
                      <p className="mt-1 text-xs text-[#050505]/55">
                        Certification vérifiable, partageable sur LinkedIn et dans votre wallet EDGE.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {showPricing ? (
              <div className="rounded-[24px] border border-[#050505]/8 bg-white p-6 lg:hidden">
                <h3 className="text-lg font-semibold">Tarifs</h3>
                <PricingCards
                  course={course}
                  detail={detail}
                  conseillerHref={links.conseiller}
                  demoHref={links.demo}
                />
              </div>
            ) : null}
          </section>

          {/* 10. INTERVENANTS — enrichis */}
          {enrichedTrainers.length > 0 ? (
            <section id="intervenants" className="scroll-mt-40 space-y-6">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Intervenants</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                {enrichedTrainers.map((trainer) => (
                  <div key={trainer.id} className="rounded-[24px] border border-[#050505]/8 bg-white p-6">
                    <div className="flex gap-5">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#F7F7F5]">
                        {trainer.photoUrl ? (
                          <Image src={trainer.photoUrl} alt={trainer.name} fill className="object-cover" unoptimized />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        {trainer.role === "primary" ? (
                          <p className="text-xs font-semibold uppercase tracking-wider text-edge-accent">
                            Intervenant principal
                          </p>
                        ) : null}
                        <p className="text-lg font-semibold">{trainer.name}</p>
                        <p className="text-sm text-[#050505]/55">{trainer.fonction}</p>
                        <p className="mt-1 text-xs text-[#050505]/45">{trainer.years}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4 border-t border-[#050505]/8 pt-5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#050505]/40">Expertises</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {trainer.expertises.map((e) => (
                            <span key={e} className="rounded-full bg-[#F7F7F5] px-2.5 py-1 text-xs text-[#050505]/65">
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#050505]/40">Domaines d&apos;intervention</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {trainer.domaines.map((d) => (
                            <span key={d} className="rounded-full bg-[#F7F7F5] px-2.5 py-1 text-xs text-[#050505]/65">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#050505]/40">Certifications</p>
                          <ul className="mt-1.5 space-y-1">
                            {trainer.certifications.map((c) => (
                              <li key={c} className="flex items-center gap-1.5 text-xs text-[#050505]/65">
                                <CheckCircle2 className="h-3.5 w-3.5 text-edge-accent" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#050505]/40">Open Badges</p>
                          <ul className="mt-1.5 space-y-1">
                            {trainer.openBadges.map((b) => (
                              <li key={b} className="flex items-center gap-1.5 text-xs text-[#050505]/65">
                                <Award className="h-3.5 w-3.5 text-edge-accent" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 11. INDICATEURS QUALITÉ */}
          <section id="qualite" className="scroll-mt-40 space-y-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Nos indicateurs qualité</h2>
            {qualityIndicators.available ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {qualityIndicators.indicators.map((indicator) => (
                  <div key={indicator.label} className="rounded-[20px] border border-[#050505]/8 bg-white p-5 text-center">
                    <p className="text-2xl font-semibold tracking-tight text-edge-accent">{indicator.value}</p>
                    <p className="mt-1 text-xs text-[#050505]/55">{indicator.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-[#050505]/8 bg-white p-7">
                <div className="flex items-start gap-3">
                  <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-edge-accent" />
                  <p className="text-sm leading-relaxed text-[#050505]/60">
                    {qualityIndicators.fallbackMessage}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {qualityIndicators.indicators.map((indicator) => (
                    <div
                      key={indicator.label}
                      className="rounded-[16px] border border-dashed border-[#050505]/12 bg-[#F7F7F5] p-4 text-center"
                    >
                      <p className="text-sm font-semibold text-[#050505]/30">—</p>
                      <p className="mt-1 text-[11px] text-[#050505]/45">{indicator.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 12. CERTIFICATION */}
          <section className="scroll-mt-40">
            <div className="rounded-[24px] border border-edge-accent/15 bg-gradient-to-br from-edge-accent/[0.06] to-white p-7">
              <div className="flex items-center gap-4">
                {detail.badgeImageUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={detail.badgeImageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-edge-accent/10 text-edge-accent">
                    <Award className="h-7 w-7" />
                  </span>
                )}
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em]">Certification</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#050505]/60">
                    Cette formation permet l&apos;obtention d&apos;un Open Badge EDGE vérifiable en ligne
                    attestant des compétences acquises.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 13. APRÈS LA FORMATION */}
          <section className="scroll-mt-40">
            <div className="rounded-[24px] border border-[#050505]/8 bg-white p-7 sm:p-9">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Et après ?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#050505]/60">
                Le développement des compétences ne s&apos;arrête pas à la fin de la formation.
              </p>
              <div className="mt-8 max-w-xl">
                <VerticalTimeline steps={AFTER_TRAINING_STEPS} accent={false} />
              </div>
            </div>
          </section>

          {/* SESSIONS */}
          {isBlockVisible(detail, "sessions") && detail.sessions.length > 0 ? (
            <section id="sessions" className="scroll-mt-40 space-y-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Sessions</h2>
              <div className="space-y-3">
                {detail.sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#050505]/8 bg-white p-5"
                  >
                    <div className="flex items-center gap-4">
                      <CalendarDays className="h-5 w-5 text-edge-accent" />
                      <div>
                        <p className="font-medium">{s.date}</p>
                        <p className="flex items-center gap-1 text-sm text-[#050505]/50">
                          <MapPin className="h-3.5 w-3.5" /> {s.city}
                          {s.seats ? ` · ${s.seats}` : ""}
                          {s.format ? ` · ${s.format}` : ""}
                        </p>
                      </div>
                    </div>
                    {s.price ? <span className="text-sm font-semibold">{s.price}</span> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* FAQ */}
          {isBlockVisible(detail, "faq") && detail.faq.length > 0 ? (
            <section id="faq" className="scroll-mt-40 space-y-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">FAQ</h2>
              <div className="space-y-4">
                {detail.faq.map((item) => (
                  <div key={item.q} className="rounded-[20px] border border-[#050505]/8 bg-white p-6">
                    <p className="font-medium">{item.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#050505]/60">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {showPricing ? (
          <div className="hidden lg:block">
            <PricingSidebar
              course={course}
              detail={detail}
              demoHref={links.demo}
              conseillerHref={links.conseiller}
            />
          </div>
        ) : null}
      </div>

      {/* 14. FOOTER CTA */}
      <section className="border-t border-[#050505]/8 bg-[#050505] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Prêt à développer les compétences de vos équipes ?
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/55">
            Tout commence par un diagnostic EDGE — réponse sous 24 h.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={links.demo} variant="white" shape="revolut">
              Commencer par un diagnostic EDGE
            </EdgePremiumButton>
            <EdgePremiumButton href={links.conseiller} variant="outline-white" shape="revolut">
              Réserver cette formation
            </EdgePremiumButton>
            <EdgePremiumButton href={catalogHref} variant="outline-white" shape="revolut">
              Autres formations <ChevronRight className="ml-1 h-4 w-4" />
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </div>
  );
}

export type { TrainingModule } from "@/lib/edge-site/training-catalog";

export function EdgeTrainingDetailPageFromModule({ module }: { module: TrainingModule }) {
  const course = enrichCoursePublic(catalogModuleToCourseRow(module.id));
  return <EdgeTrainingDetailPage course={course} />;
}
