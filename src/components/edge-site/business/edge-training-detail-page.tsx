"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import {
  buildTrainingCourseDetail,
  formatInterPrice,
  formatIntraPrice,
  isBlockVisible,
} from "@/lib/training-courses/build-detail";
import type { TrainingPageBlockId } from "@/lib/training-courses/cms-types";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";

const BLOCK_ANCHORS: Partial<Record<TrainingPageBlockId, string>> = {
  presentation: "presentation",
  why_choose: "pourquoi",
  objectives: "objectifs",
  skills: "competences",
  program: "programme",
  trainers: "intervenants",
  sessions: "sessions",
  faq: "faq",
  prerequisites: "prerequis",
  audience: "public",
  open_badge: "badge",
  benefits: "benefices",
  methodology: "methodologie",
  case_studies: "cas-pratiques",
  deliverables: "livrables",
};

type BadgeMeta = { name?: string | null; imageUrl?: string | null };

type Props = {
  course: TrainingCoursePublic;
  badgeMeta?: BadgeMeta | null;
};

function PricingSidebar({
  course,
  detail,
  demoHref,
  conseillerHref,
  visible,
}: {
  course: TrainingCoursePublic;
  detail: ReturnType<typeof buildTrainingCourseDetail>;
  demoHref: string;
  conseillerHref: string;
  visible: boolean;
}) {
  if (!visible) return null;
  const interPrice = formatInterPrice(course);
  const intraPrice = formatIntraPrice(course);
  const maxIntra = detail.maxIntraParticipants;

  return (
    <aside className="sticky top-20 space-y-4">
      <div className="rounded-[24px] border border-[#050505]/8 bg-white p-6 shadow-[0_8px_32px_rgba(5,5,5,0.06)]">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Tarifs</h2>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/45">Prix inter</p>
            <p className="mt-2 text-base font-semibold text-[#050505]">{interPrice}</p>
            <p className="mt-1 text-xs text-[#050505]/50">Par participant · sessions inter-entreprises</p>
          </div>
          <div className="rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/45">Prix intra</p>
            <p className="mt-2 text-base font-semibold text-[#050505]">{intraPrice}</p>
            <p className="mt-1 text-xs text-[#050505]/50">Prix groupe pour votre équipe</p>
            <p className="mt-2 text-xs font-medium text-edge-accent">
              Formation intra limitée à {maxIntra} participants.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          <EdgePremiumButton href={conseillerHref} shape="revolut" className="w-full">
            Demander un devis intra
          </EdgePremiumButton>
          <EdgePremiumButton href={demoHref} variant="secondary-light" shape="revolut" className="w-full">
            Réserver en inter
          </EdgePremiumButton>
        </div>
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
          {course.formats?.length ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {course.formats.map((format) => (
                <span
                  key={format}
                  className="rounded-full border border-[#050505]/10 bg-[#F7F7F5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#050505]/55"
                >
                  {format}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
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

  const navItems = detail.pageBlocks
    .filter((b) => b.visible && BLOCK_ANCHORS[b.id])
    .map((b) => ({ id: BLOCK_ANCHORS[b.id]!, label: b.label }));

  const showPricing = isBlockVisible(detail, "pricing");

  const renderBlock = (blockId: TrainingPageBlockId) => {
    if (!isBlockVisible(detail, blockId)) return null;
    const anchor = BLOCK_ANCHORS[blockId];

    switch (blockId) {
      case "presentation":
        return (
          <section key={blockId} id={anchor} className="space-y-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Présentation</h2>
              {course.long_description ? (
                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-[#050505]/65">
                  {course.long_description}
                </p>
              ) : null}
            </div>
          </section>
        );
      case "objectives":
        if (!detail.objectives.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Objectifs</h2>
            <ul className="mt-6 space-y-2">
              {detail.objectives.map((o) => (
                <li key={o} className="flex gap-3 text-sm text-[#050505]/65">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                  {o}
                </li>
              ))}
            </ul>
          </section>
        );
      case "why_choose":
        if (!detail.whyFollow.length) return null;
        return (
          <section key={blockId} id={anchor} className="rounded-[24px] border border-[#050505]/8 bg-white p-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Pourquoi choisir cette formation</h2>
            <ul className="mt-5 space-y-3">
              {detail.whyFollow.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#050505]/65">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        );
      case "audience":
        if (!detail.audience.length) return null;
        return (
          <section key={blockId} id={anchor} className="rounded-[24px] border border-[#050505]/8 bg-white p-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">À qui s&apos;adresse cette formation</h2>
            <ul className="mt-5 space-y-2">
              {detail.audience.map((a) => (
                <li key={a} className="flex gap-3 text-sm text-[#050505]/65">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </section>
        );
      case "skills":
        if (!detail.competences.length) return null;
        return (
          <section key={blockId} id={anchor} className="rounded-[24px] border border-[#635BFF]/15 bg-gradient-to-br from-[#635BFF]/8 to-white p-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Compétences acquises</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.competences.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-[#635BFF]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#635BFF]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );
      case "open_badge":
        if (!detail.badgeLabel) return null;
        return (
          <section key={blockId} id={anchor} className="rounded-[24px] border border-[#050505]/8 bg-white p-7">
            <h2 className="text-lg font-semibold">Open Badge</h2>
            <div className="mt-4 flex items-center gap-4">
              {detail.badgeImageUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                  <Image src={detail.badgeImageUrl} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <Award className="h-10 w-10 text-edge-accent" />
              )}
              <div>
                <p className="text-base font-semibold">{detail.badgeLabel}</p>
                <p className="mt-1 text-sm text-[#050505]/55">
                  Certification vérifiable, partageable sur LinkedIn et dans votre wallet EDGE.
                </p>
              </div>
            </div>
          </section>
        );
      case "prerequisites":
        if (!course.prerequisites) return null;
        return (
          <section key={blockId} id={anchor} className="rounded-[20px] border border-[#050505]/8 bg-white p-5">
            <div className="flex items-start gap-4">
              <BookOpen className="h-5 w-5 shrink-0 text-edge-accent" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Prérequis</p>
                <p className="mt-1 text-sm font-medium">{course.prerequisites}</p>
              </div>
            </div>
          </section>
        );
      case "benefits":
        if (!detail.benefits.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">Bénéfices</h2>
            <ul className="mt-6 space-y-2">
              {detail.benefits.map((b) => (
                <li key={b} className="flex gap-3 text-sm text-[#050505]/65">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
        );
      case "methodology":
        if (!detail.methodology.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">Méthodologie</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {detail.methodology.map((m) => (
                <span key={m} className="rounded-full border border-[#050505]/10 bg-white px-3 py-1.5 text-xs font-medium">
                  {m}
                </span>
              ))}
            </ul>
          </section>
        );
      case "case_studies":
        if (!detail.casPratiques.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">Cas pratiques</h2>
            <ul className="mt-6 space-y-2">
              {detail.casPratiques.map((c) => (
                <li key={c} className="text-sm text-[#050505]/65">
                  {c}
                </li>
              ))}
            </ul>
          </section>
        );
      case "deliverables":
        if (!detail.deliverables.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">Livrables</h2>
            <ul className="mt-6 space-y-2">
              {detail.deliverables.map((d) => (
                <li key={d} className="text-sm text-[#050505]/65">
                  {d}
                </li>
              ))}
            </ul>
          </section>
        );
      case "program":
        if (!detail.programSections.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">Programme détaillé</h2>
            <div className="mt-8 space-y-8">
              {detail.programSections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-lg font-semibold text-[#050505]">{section.title}</h3>
                  {section.description ? (
                    <p className="mt-2 text-sm text-[#050505]/55">{section.description}</p>
                  ) : null}
                  <div className="mt-4 space-y-3">
                    {section.chapters.map((chapter, ci) => (
                      <div
                        key={chapter.id}
                        className="rounded-[20px] border border-[#050505]/8 bg-white p-5"
                      >
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
        );
      case "trainers":
        if (!detail.trainers.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">Intervenants</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {detail.trainers.map((trainer) => (
                <div key={trainer.id} className="flex gap-5 rounded-[24px] border border-[#050505]/8 bg-white p-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F7F7F5]">
                    {trainer.photoUrl ? (
                      <Image src={trainer.photoUrl} alt={trainer.name} fill className="object-cover" unoptimized />
                    ) : null}
                  </div>
                  <div>
                    {trainer.role === "primary" ? (
                      <p className="text-xs font-semibold uppercase tracking-wider text-edge-accent">
                        Intervenant principal
                      </p>
                    ) : null}
                    <p className="text-lg font-semibold">{trainer.name}</p>
                    <p className="text-sm text-[#050505]/55">{trainer.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case "sessions":
        if (!detail.sessions.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">Sessions</h2>
            <div className="mt-8 space-y-3">
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
        );
      case "faq":
        if (!detail.faq.length) return null;
        return (
          <section key={blockId} id={anchor}>
            <h2 className="text-2xl font-semibold">FAQ</h2>
            <div className="mt-8 space-y-4">
              {detail.faq.map((item) => (
                <div key={item.q} className="rounded-[20px] border border-[#050505]/8 bg-white p-6">
                  <p className="font-medium">{item.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#050505]/60">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#F7F7F5] text-[#050505]">
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
              <p className="mt-3 text-sm text-white/50">
                {[course.duration, course.level, detail.formatsLabel].filter(Boolean).join(" · ")}
              </p>
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

      {navItems.length > 0 ? (
        <div className="sticky top-0 z-30 border-b border-[#050505]/8 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-5 py-3 sm:px-8">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="shrink-0 text-sm font-medium text-[#050505]/55 hover:text-edge-accent"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_320px] lg:px-10 lg:py-16">
        <div className="min-w-0 space-y-16">
          {detail.pageBlocks.map((block) => renderBlock(block.id))}
        </div>

        <div className="hidden lg:block">
          <PricingSidebar
            course={course}
            detail={detail}
            demoHref={links.demo}
            conseillerHref={links.conseiller}
            visible={showPricing}
          />
        </div>
      </div>

      {showPricing ? (
        <section className="border-t border-[#050505]/8 bg-white px-5 py-10 lg:hidden">
          <div className="mx-auto max-w-md">
            <PricingSidebar
              course={course}
              detail={detail}
              demoHref={links.demo}
              conseillerHref={links.conseiller}
              visible
            />
          </div>
        </section>
      ) : null}

      <section className="border-t border-[#050505]/8 bg-[#050505] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-white">Réservez cette formation</h2>
          <p className="mt-3 max-w-xl text-sm text-white/55">
            Intra (jusqu&apos;à {detail.maxIntraParticipants} participants) ou inter-entreprises — réponse sous 24 h.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={links.conseiller} variant="white" shape="revolut">
              Demander un devis intra
            </EdgePremiumButton>
            <EdgePremiumButton href={links.demo} variant="outline-white" shape="revolut">
              Réserver en inter
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
import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import { catalogModuleToCourseRow, enrichCoursePublic } from "@/lib/training-courses/catalog-fallback";

export function EdgeTrainingDetailPageFromModule({ module }: { module: TrainingModule }) {
  const course = enrichCoursePublic(catalogModuleToCourseRow(module.id));
  return <EdgeTrainingDetailPage course={course} />;
}
