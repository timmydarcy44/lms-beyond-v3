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
} from "@/lib/training-courses/build-detail";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";

const NAV = [
  { id: "presentation", label: "Présentation" },
  { id: "programme", label: "Programme" },
  { id: "intervenants", label: "Intervenants" },
  { id: "sessions", label: "Sessions" },
  { id: "avis", label: "Avis" },
  { id: "faq", label: "FAQ" },
] as const;

type Props = {
  course: TrainingCoursePublic;
};

function PricingSidebar({
  course,
  detail,
  demoHref,
  conseillerHref,
}: {
  course: TrainingCoursePublic;
  detail: ReturnType<typeof buildTrainingCourseDetail>;
  demoHref: string;
  conseillerHref: string;
}) {
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
            <p className="mt-1 text-xs text-[#050505]/45">Jusqu&apos;à {maxIntra} participants</p>
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
          <p className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-edge-accent" />
            {course.duration ?? "Sur mesure"}
          </p>
          <p className="flex items-center gap-2">
            <Award className="h-3.5 w-3.5 text-edge-accent" />
            {course.badge_name ?? "Open Badge EDGE"}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(course.formats ?? ["Présentiel", "Distanciel", "Blended", "Sur mesure"]).map((format) => (
              <span
                key={format}
                className="rounded-full border border-[#050505]/10 bg-[#F7F7F5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#050505]/55"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function EdgeTrainingDetailPage({ course }: Props) {
  const { links } = useEdgePremiumConfig();
  const detail = useMemo(() => buildTrainingCourseDetail(course), [course]);
  const catalogHref = edgeMarketingHref("/business/former-vos-equipes");
  const leadTrainer = detail.trainers[0];
  const heroImage =
    course.cover_url ??
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&h=900&fit=crop";
  const program = course.program ?? [];

  return (
    <div className="bg-[#F7F7F5] text-[#050505]">
      <section className="relative overflow-hidden bg-[#050505] px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        <div className="absolute inset-0">
          <Image src={heroImage} alt="" fill className="object-cover opacity-45" unoptimized priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/92 to-[#050505]/55" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <Link href={catalogHref} className="text-xs font-medium text-white/50 hover:text-white">
            ← Retour au catalogue
          </Link>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent-light">
                {course.domain ?? "Formation professionnelle"}
              </p>
              <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                {course.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{detail.benefit}</p>
              <p className="mt-3 text-sm text-white/50">
                {course.duration ?? "—"} · {course.level ?? "—"} · {detail.formatsLabel}
              </p>
            </div>
            {leadTrainer ? (
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                    <Image src={leadTrainer.photoUrl} alt={leadTrainer.name} fill className="object-cover" unoptimized />
                  </div>
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

      <div className="sticky top-0 z-30 border-b border-[#050505]/8 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-5 py-3 sm:px-8">
          {NAV.map((item) => (
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

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_320px] lg:px-10 lg:py-16">
        <div className="min-w-0 space-y-16">
          <section id="presentation">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Présentation</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#050505]/65">
              {course.long_description ?? detail.benefit}
            </p>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Objectifs</h3>
                <ul className="mt-4 space-y-2">
                  {(course.objectives ?? detail.whyFollow).map((o) => (
                    <li key={o} className="flex gap-3 text-sm text-[#050505]/65">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Clock, label: "Durée", value: course.duration ?? "—" },
                  { icon: Users, label: "Public", value: (course.audience ?? []).join(", ") || "Professionnels" },
                  { icon: BookOpen, label: "Prérequis", value: course.prerequisites ?? "Aucun" },
                  { icon: Award, label: "Certification", value: course.badge_name ?? "Open Badge EDGE" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 rounded-[20px] border border-[#050505]/8 bg-white p-5">
                    <Icon className="h-5 w-5 shrink-0 text-edge-accent" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">{label}</p>
                      <p className="mt-1 text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
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
            <div className="rounded-[24px] border border-[#050505]/8 bg-white p-7">
              <h3 className="text-lg font-semibold tracking-[-0.02em]">À qui s&apos;adresse cette formation</h3>
              <ul className="mt-5 space-y-2">
                {(course.audience ?? ["Managers", "Équipes opérationnelles", "Professionnels en évolution"]).map((a) => (
                  <li key={a} className="flex gap-3 text-sm text-[#050505]/65">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#635BFF]/15 bg-gradient-to-br from-[#635BFF]/8 to-white p-7">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="text-lg font-semibold tracking-[-0.02em]">Compétences acquises</h3>
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
              <div className="rounded-2xl border border-[#050505]/8 bg-white px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">Open Badge</p>
                <p className="mt-2 flex items-center gap-2 text-base font-semibold text-[#050505]">
                  <Award className="h-5 w-5 text-edge-accent" />
                  {course.badge_name ?? "Open Badge EDGE"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#050505]/50">
                  Certification vérifiable, partageable sur LinkedIn et dans votre wallet EDGE.
                </p>
              </div>
            </div>
          </section>

          <section id="programme">
            <h2 className="text-2xl font-semibold">Programme détaillé</h2>
            <p className="mt-2 text-sm text-[#050505]/55">Méthodes : {detail.methodology.join(" · ")}</p>
            <div className="mt-8 space-y-3">
              {program.map((step, i) => (
                <div key={`${step.title}-${i}`} className="flex gap-4 rounded-[20px] border border-[#050505]/8 bg-white p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-edge-accent/10 text-sm font-semibold text-edge-accent">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-xs text-[#050505]/45">{step.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="intervenants">
            <h2 className="text-2xl font-semibold">Intervenants</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {detail.trainers.map((trainer) => (
                <div key={trainer.id} className="flex gap-5 rounded-[24px] border border-[#050505]/8 bg-white p-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                    <Image src={trainer.photoUrl} alt={trainer.name} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{trainer.name}</p>
                    <p className="text-sm text-edge-accent">{trainer.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="sessions">
            <h2 className="text-2xl font-semibold">Sessions</h2>
            <div className="mt-8 space-y-3">
              {detail.sessions.map((s) => (
                <div key={s.date} className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#050505]/8 bg-white p-5">
                  <div className="flex items-center gap-4">
                    <CalendarDays className="h-5 w-5 text-edge-accent" />
                    <div>
                      <p className="font-medium">{s.date}</p>
                      <p className="flex items-center gap-1 text-sm text-[#050505]/50">
                        <MapPin className="h-3.5 w-3.5" /> {s.city} · {s.seats}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{s.price}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="avis">
            <h2 className="text-2xl font-semibold">Avis participants</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {detail.reviews.map((r) => (
                <blockquote key={r.author} className="rounded-[24px] border border-[#050505]/8 bg-white p-6">
                  <p className="text-sm leading-relaxed text-[#050505]/70">&ldquo;{r.text}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold">{r.author}</p>
                </blockquote>
              ))}
            </div>
          </section>

          <section id="faq">
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
        </div>

        <div className="hidden lg:block">
          <PricingSidebar
            course={course}
            detail={detail}
            demoHref={links.demo}
            conseillerHref={links.conseiller}
          />
        </div>
      </div>

      <section className="border-t border-[#050505]/8 bg-white px-5 py-10 lg:hidden">
        <div className="mx-auto max-w-md">
          <PricingSidebar
            course={course}
            detail={detail}
            demoHref={links.demo}
            conseillerHref={links.conseiller}
          />
        </div>
      </section>

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

// Compatibilité legacy — module catalog
export type { TrainingModule } from "@/lib/edge-site/training-catalog";
import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import { catalogModuleToCourseRow, enrichCoursePublic } from "@/lib/training-courses/catalog-fallback";

export function EdgeTrainingDetailPageFromModule({ module }: { module: TrainingModule }) {
  const course = enrichCoursePublic(catalogModuleToCourseRow(module.id));
  return <EdgeTrainingDetailPage course={course} />;
}
