"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import { catalogModuleToCourseRow, enrichCoursePublic } from "@/lib/training-courses/catalog-fallback";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
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
import type { TrainingCoursePublic } from "@/lib/training-courses/types";

const NAV_SECTIONS = [
  { id: "presentation", label: "Présentation" },
  { id: "programme", label: "Programme" },
  { id: "informations", label: "Informations" },
  { id: "intervenants", label: "Intervenants" },
  { id: "sessions", label: "Sessions" },
  { id: "faq", label: "FAQ" },
] as const;

type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];

type BadgeMeta = { name?: string | null; imageUrl?: string | null };

type Props = {
  course: TrainingCoursePublic;
  badgeMeta?: BadgeMeta | null;
};

function sectionHasContent(id: NavSectionId, course: TrainingCoursePublic, detail: TrainingCourseDetail): boolean {
  switch (id) {
    case "presentation":
      return (
        (isBlockVisible(detail, "presentation") && Boolean(course.long_description)) ||
        (isBlockVisible(detail, "why_choose") && detail.whyFollow.length > 0) ||
        (isBlockVisible(detail, "objectives") && detail.objectives.length > 0) ||
        (isBlockVisible(detail, "benefits") && detail.benefits.length > 0)
      );
    case "programme":
      return (
        (isBlockVisible(detail, "program") && detail.programSections.length > 0) ||
        (isBlockVisible(detail, "skills") && detail.competences.length > 0) ||
        (isBlockVisible(detail, "case_studies") && detail.casPratiques.length > 0) ||
        (isBlockVisible(detail, "deliverables") && detail.deliverables.length > 0) ||
        (isBlockVisible(detail, "methodology") && detail.methodology.length > 0)
      );
    case "informations":
      return (
        (isBlockVisible(detail, "audience") && detail.audience.length > 0) ||
        (isBlockVisible(detail, "prerequisites") && Boolean(course.prerequisites)) ||
        Boolean(course.duration || course.level || course.formats?.length) ||
        (isBlockVisible(detail, "open_badge") && Boolean(detail.badgeLabel)) ||
        isBlockVisible(detail, "pricing")
      );
    case "intervenants":
      return isBlockVisible(detail, "trainers") && detail.trainers.length > 0;
    case "sessions":
      return isBlockVisible(detail, "sessions") && detail.sessions.length > 0;
    case "faq":
      return isBlockVisible(detail, "faq") && detail.faq.length > 0;
    default:
      return false;
  }
}

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

        {/* Desktop : 6 onglets équilibrés, sans scroll horizontal */}
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
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <EdgePremiumButton href={conseillerHref} shape="revolut" className="sm:flex-1">
            Demander un devis intra
          </EdgePremiumButton>
          <EdgePremiumButton href={demoHref} variant="secondary-light" shape="revolut" className="sm:flex-1">
            Réserver en inter
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

  const navItems = NAV_SECTIONS.filter((s) => sectionHasContent(s.id, course, detail)).map((s) => ({
    id: s.id,
    label: s.label,
  }));

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

      <TrainingSectionNav items={navItems} />

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_300px] lg:px-10 lg:py-16">
        <div className="min-w-0 space-y-20">
          {sectionHasContent("presentation", course, detail) ? (
            <section id="presentation" className="scroll-mt-40 space-y-10">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Présentation</h2>

              {isBlockVisible(detail, "presentation") && course.long_description ? (
                <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-[#050505]/65">
                  {course.long_description}
                </p>
              ) : null}

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

              {isBlockVisible(detail, "objectives") && detail.objectives.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold">Objectifs</h3>
                  <ul className="mt-4 space-y-2">
                    {detail.objectives.map((o) => (
                      <li key={o} className="flex gap-3 text-sm text-[#050505]/65">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {isBlockVisible(detail, "benefits") && detail.benefits.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold">Bénéfices</h3>
                  <ul className="mt-4 space-y-2">
                    {detail.benefits.map((b) => (
                      <li key={b} className="flex gap-3 text-sm text-[#050505]/65">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {sectionHasContent("programme", course, detail) ? (
            <section id="programme" className="scroll-mt-40 space-y-10">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Programme</h2>

              {isBlockVisible(detail, "program") && detail.programSections.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold">Programme détaillé</h3>
                  <div className="mt-6 space-y-8">
                    {detail.programSections.map((section) => (
                      <div key={section.id}>
                        <h4 className="font-semibold text-[#050505]">{section.title}</h4>
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
                </div>
              ) : null}

              {isBlockVisible(detail, "skills") && detail.competences.length > 0 ? (
                <div className="rounded-[24px] border border-[#635BFF]/15 bg-gradient-to-br from-[#635BFF]/8 to-white p-7">
                  <h3 className="text-lg font-semibold">Compétences acquises</h3>
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
                </div>
              ) : null}

              {isBlockVisible(detail, "case_studies") && detail.casPratiques.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold">Cas pratiques</h3>
                  <ul className="mt-4 space-y-2">
                    {detail.casPratiques.map((c) => (
                      <li key={c} className="text-sm text-[#050505]/65">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {isBlockVisible(detail, "deliverables") && detail.deliverables.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold">Livrables</h3>
                  <ul className="mt-4 space-y-2">
                    {detail.deliverables.map((d) => (
                      <li key={d} className="text-sm text-[#050505]/65">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {isBlockVisible(detail, "methodology") && detail.methodology.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold">Méthodologie</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {detail.methodology.map((m) => (
                      <span
                        key={m}
                        className="rounded-full border border-[#050505]/10 bg-white px-3 py-1.5 text-xs font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {sectionHasContent("informations", course, detail) ? (
            <section id="informations" className="scroll-mt-40 space-y-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Informations</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {isBlockVisible(detail, "audience") && detail.audience.length > 0 ? (
                  <div className="rounded-[20px] border border-[#050505]/8 bg-white p-5 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Public cible</p>
                    <ul className="mt-3 space-y-2">
                      {detail.audience.map((a) => (
                        <li key={a} className="flex gap-2 text-sm text-[#050505]/65">
                          <Users className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {isBlockVisible(detail, "prerequisites") && course.prerequisites ? (
                  <div className="rounded-[20px] border border-[#050505]/8 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Prérequis</p>
                    <p className="mt-2 text-sm font-medium">{course.prerequisites}</p>
                  </div>
                ) : null}

                {course.duration ? (
                  <div className="rounded-[20px] border border-[#050505]/8 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Durée</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-edge-accent" />
                      {course.duration}
                    </p>
                  </div>
                ) : null}

                {course.level ? (
                  <div className="rounded-[20px] border border-[#050505]/8 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Niveau</p>
                    <p className="mt-2 text-sm font-medium">{course.level}</p>
                  </div>
                ) : null}

                {course.formats?.length ? (
                  <div className="rounded-[20px] border border-[#050505]/8 bg-white p-5 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Modalités</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {course.formats.map((format) => (
                        <span
                          key={format}
                          className="rounded-full border border-[#050505]/10 bg-[#F7F7F5] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#050505]/55"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isBlockVisible(detail, "open_badge") && detail.badgeLabel ? (
                  <div className="rounded-[20px] border border-[#050505]/8 bg-white p-5 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Certification & Open Badge</p>
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
          ) : null}

          {sectionHasContent("intervenants", course, detail) ? (
            <section id="intervenants" className="scroll-mt-40 space-y-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Intervenants</h2>
              <div className="grid gap-6 sm:grid-cols-2">
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
          ) : null}

          {sectionHasContent("sessions", course, detail) ? (
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
              <div className="flex flex-col gap-3 sm:flex-row">
                <EdgePremiumButton href={links.demo} shape="revolut" className="sm:flex-1">
                  Réserver en inter
                </EdgePremiumButton>
                <EdgePremiumButton href={links.conseiller} variant="secondary-light" shape="revolut" className="sm:flex-1">
                  Demander un devis intra
                </EdgePremiumButton>
              </div>
            </section>
          ) : null}

          {sectionHasContent("faq", course, detail) ? (
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

export function EdgeTrainingDetailPageFromModule({ module }: { module: TrainingModule }) {
  const course = enrichCoursePublic(catalogModuleToCourseRow(module.id));
  return <EdgeTrainingDetailPage course={course} />;
}
