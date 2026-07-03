"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { buildTrainingModuleDetail } from "@/lib/edge-site/training-module-detail";
import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";

const NAV = [
  { id: "presentation", label: "Présentation" },
  { id: "programme", label: "Programme" },
  { id: "intervenants", label: "Intervenants" },
  { id: "sessions", label: "Sessions" },
  { id: "avis", label: "Avis" },
  { id: "faq", label: "FAQ" },
] as const;

type Props = {
  module: TrainingModule;
};

export function EdgeTrainingDetailPage({ module }: Props) {
  const { links } = useEdgePremiumConfig();
  const detail = useMemo(() => buildTrainingModuleDetail(module), [module]);
  const catalogHref = edgeMarketingHref("/business/former-vos-equipes");
  const leadTrainer = detail.trainers[0];

  return (
    <div className="bg-[#F7F7F5] text-[#050505]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#050505] px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        <div className="absolute inset-0">
          <Image src={detail.heroImage} alt="" fill className="object-cover opacity-45" unoptimized priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/92 to-[#050505]/55" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Link href={catalogHref} className="text-xs font-medium text-white/50 hover:text-white">
              ← Retour au catalogue
            </Link>
            <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent-light">
              {detail.domainTitle}
            </p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
              {detail.module.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{detail.benefit}</p>
            <p className="mt-3 text-sm text-white/50">
              {detail.duration} · {detail.levelLabel} · {detail.formatsLabel}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <EdgePremiumButton href={links.demo} variant="white" shape="revolut">
                Réserver une session
              </EdgePremiumButton>
              <EdgePremiumButton href={links.conseiller} variant="outline-white" shape="revolut">
                Parler à un conseiller
              </EdgePremiumButton>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
            {leadTrainer ? (
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
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-white/45">Tarif</p>
                <p className="font-semibold text-white">{detail.price}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-white/45">Open Badge</p>
                <p className="font-semibold text-white">{detail.badgeName}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nav sticky */}
      <div className="sticky top-0 z-30 border-b border-[#050505]/8 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-5 py-3 sm:px-8">
          {NAV.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="shrink-0 text-sm font-medium text-[#050505]/55 hover:text-edge-accent">
              {item.label}
            </a>
          ))}
          <EdgePremiumButton href={links.demo} className="ml-auto shrink-0" shape="revolut">
            Réserver
          </EdgePremiumButton>
        </div>
      </div>

      {/* Galerie humaine */}
      <section className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {detail.galleryImages.map((url) => (
          <div key={url} className="relative aspect-[4/3]">
            <Image src={url} alt="" fill className="object-cover" unoptimized />
          </div>
        ))}
      </section>

      {/* Présentation */}
      <section id="presentation" className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Présentation</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#050505]/65">
            {detail.benefit} Cette formation s&apos;adresse aux professionnels qui souhaitent progresser avec une
            pédagogie concrète, des mises en situation et un accompagnement par des experts du réseau EDGE.
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">Pourquoi suivre cette formation</h3>
              <ul className="mt-5 space-y-3">
                {detail.whyFollow.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#050505]/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <h3 className="mt-10 text-lg font-semibold">Objectifs</h3>
              <ul className="mt-4 space-y-2">
                {detail.module.objectives.map((o) => (
                  <li key={o} className="text-sm text-[#050505]/65">· {o}</li>
                ))}
              </ul>
              <h3 className="mt-10 text-lg font-semibold">Compétences développées</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.competences.map((c) => (
                  <span key={c} className="rounded-full border border-edge-accent/20 bg-edge-accent/8 px-3 py-1 text-xs font-medium text-edge-accent">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: Clock, label: "Durée", value: detail.duration },
                { icon: Users, label: "Public", value: detail.public },
                { icon: BookOpen, label: "Prérequis", value: detail.prerequisite },
                { icon: Award, label: "Certification", value: detail.badgeName },
                { icon: BarChart3, label: "Tarifs", value: detail.price },
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
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">Programme détaillé</h2>
          <p className="mt-2 text-sm text-[#050505]/55">Méthodes pédagogiques : {detail.methodology.join(" · ")}</p>
          <div className="mt-8 space-y-3">
            {detail.program.map((step, i) => (
              <div key={step.title} className="flex gap-4 rounded-[20px] border border-[#050505]/8 p-5">
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

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">Exercices</h3>
              <ul className="mt-4 space-y-2">
                {detail.exercises.map((e) => (
                  <li key={e} className="text-sm text-[#050505]/65">· {e}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Cas pratiques & livrables</h3>
              <ul className="mt-4 space-y-2">
                {detail.casPratiques.map((c) => (
                  <li key={c} className="text-sm text-[#050505]/65">· {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Intervenants */}
      <section id="intervenants" className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">Intervenants</h2>
          <p className="mt-2 text-sm text-[#050505]/55">Des spécialistes du réseau EDGE, évalués par les entreprises.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {detail.trainers.map((trainer) => (
              <div key={trainer.id} className="flex gap-5 rounded-[24px] border border-[#050505]/8 bg-white p-6">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
                  <Image src={trainer.photoUrl} alt={trainer.name} fill className="object-cover" unoptimized />
                </div>
                <div>
                  <p className="text-lg font-semibold">{trainer.name}</p>
                  <p className="text-sm text-edge-accent">{trainer.specialty}</p>
                  <p className="mt-2 text-xs text-[#050505]/45">
                    {trainer.missionsCount} missions · {trainer.companiesCount} entreprises
                  </p>
                  <div className="mt-2 inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sessions & tarifs */}
      <section id="sessions" className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">Sessions & tarifs</h2>
          <div className="mt-8 space-y-3">
            {detail.sessions.map((s) => (
              <div key={s.date} className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#050505]/8 p-5">
                <div className="flex items-center gap-4">
                  <CalendarDays className="h-5 w-5 text-edge-accent" />
                  <div>
                    <p className="font-medium">{s.date}</p>
                    <p className="flex items-center gap-1 text-sm text-[#050505]/50">
                      <MapPin className="h-3.5 w-3.5" /> {s.city} · {s.seats}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">{s.price}</span>
                  <EdgePremiumButton href={links.demo} shape="revolut">
                    Réserver
                  </EdgePremiumButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis */}
      <section id="avis" className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">Avis participants</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {detail.reviews.map((r) => (
              <blockquote key={r.author} className="rounded-[24px] border border-[#050505]/8 bg-white p-6">
                <div className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#050505]/70">&ldquo;{r.text}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image src={r.photoUrl} alt={r.author} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.author}</p>
                    <p className="text-xs text-[#050505]/45">
                      {r.role} · {r.company}
                    </p>
                  </div>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-8 space-y-4">
            {detail.faq.map((item) => (
              <div key={item.q} className="rounded-[20px] border border-[#050505]/8 p-6">
                <p className="font-medium">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#050505]/60">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#050505]/8 bg-[#050505] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-white">Réservez cette formation</h2>
          <p className="mt-3 max-w-xl text-sm text-white/55">
            Intra, inter-entreprises ou sur mesure — nos conseillers vous répondent sous 24 h.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={links.demo} variant="white" shape="revolut">
              Réserver maintenant
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
