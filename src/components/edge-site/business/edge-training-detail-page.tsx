"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Award,
  BarChart3,
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

type Props = {
  module: TrainingModule;
};

export function EdgeTrainingDetailPage({ module }: Props) {
  const { links } = useEdgePremiumConfig();
  const detail = useMemo(() => buildTrainingModuleDetail(module), [module]);
  const catalogHref = edgeMarketingHref("/business/former-vos-equipes");

  return (
    <div className="bg-[#F7F7F5] text-[#050505]">
      <section className="relative overflow-hidden bg-[#050505] px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&h=900&fit=crop"
            alt=""
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-[#050505]/60" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <Link href={catalogHref} className="text-xs font-medium text-white/50 hover:text-white">
              ← Catalogue formations
            </Link>
            <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent-light">
              {detail.domainTitle} · {detail.module.code}
            </p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
              {detail.module.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
              Niveau {detail.module.level} — {detail.levelLabel} · {detail.formatsLabel} · {detail.duration}
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
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                <Image src={detail.trainer.photoUrl} alt={detail.trainer.name} fill className="object-cover" unoptimized />
              </div>
              <div>
                <p className="text-xs text-white/50">Animé par</p>
                <p className="font-semibold text-white">{detail.trainer.name}</p>
                <p className="text-sm text-white/60">{detail.trainer.specialty}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-white/45">Satisfaction</p>
                <p className="font-semibold text-white">{detail.satisfaction}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-white/45">Open Badge</p>
                <p className="font-semibold text-white">{detail.badgeName}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b border-[#050505]/8 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-5 py-3 text-sm font-medium text-[#050505]/55 sm:px-8">
          {["Présentation", "Programme", "Formateur", "Sessions", "FAQ"].map((s) => (
            <a key={s} href={`#${s.toLowerCase()}`} className="shrink-0 hover:text-edge-accent">
              {s}
            </a>
          ))}
          <EdgePremiumButton href={links.demo} className="ml-auto shrink-0" shape="revolut">
            Réserver
          </EdgePremiumButton>
        </div>
      </div>

      <section id="présentation" className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Pourquoi suivre cette formation</h2>
            <ul className="mt-6 space-y-3">
              {detail.whyFollow.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#050505]/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <h3 className="mt-10 text-lg font-semibold">Objectifs pédagogiques</h3>
            <ul className="mt-4 space-y-2">
              {detail.module.objectives.map((o) => (
                <li key={o} className="text-sm text-[#050505]/65">· {o}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {[
              { icon: Clock, label: "Durée", value: detail.duration },
              { icon: Users, label: "Public", value: detail.public },
              { icon: Award, label: "Certification", value: detail.badgeName },
              { icon: BarChart3, label: "Prix", value: detail.price },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 rounded-[20px] border border-[#050505]/8 bg-white p-5">
                <Icon className="h-5 w-5 text-edge-accent" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">{label}</p>
                  <p className="mt-1 text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="programme" className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">Programme détaillé</h2>
          <p className="mt-2 text-sm text-[#050505]/55">Méthodes : {detail.methodology.join(" · ")}</p>
          <div className="mt-8 space-y-3">
            {detail.program.map((step, i) => (
              <div key={step.title} className="flex gap-4 rounded-[20px] border border-[#050505]/8 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-edge-accent/10 text-sm font-semibold text-edge-accent">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-xs text-[#050505]/45">{step.duration}</p>
                </div>
              </div>
            ))}
          </div>
          <h3 className="mt-10 text-lg font-semibold">Livrables attendus</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {detail.module.deliverables.map((d) => (
              <span key={d} className="rounded-full border border-edge-accent/20 bg-edge-accent/8 px-3 py-1 text-xs font-medium text-edge-accent">
                {d}
              </span>
            ))}
          </ul>
        </div>
      </section>

      <section id="formateur" className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">Votre formateur</h2>
          <div className="mt-8 flex flex-col gap-8 rounded-[28px] border border-[#050505]/8 bg-white p-8 sm:flex-row sm:items-center">
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-[24px]">
              <Image src={detail.trainer.photoUrl} alt={detail.trainer.name} fill className="object-cover" unoptimized />
            </div>
            <div>
              <p className="text-xl font-semibold">{detail.trainer.name}</p>
              <p className="mt-1 text-edge-accent">{detail.trainer.specialty}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#050505]/55">
                <span>{detail.trainer.missionsCount} missions</span>
                <span>{detail.trainer.companiesCount} entreprises</span>
                <span className="inline-flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#050505]/65">
                Spécialiste du réseau EDGE, {detail.trainer.name.split(" ")[0]} accompagne des équipes
                sur des enjeux concrets avec une pédagogie orientée résultats.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="sessions" className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">Prochaines sessions</h2>
          <div className="mt-8 space-y-3">
            {detail.sessions.map((s) => (
              <div key={s.date} className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[#050505]/8 p-5">
                <div className="flex items-center gap-4">
                  <CalendarDays className="h-5 w-5 text-edge-accent" />
                  <div>
                    <p className="font-medium">{s.date}</p>
                    <p className="flex items-center gap-1 text-sm text-[#050505]/50">
                      <MapPin className="h-3.5 w-3.5" /> {s.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#050505]/45">{s.seats}</span>
                  <EdgePremiumButton href={links.demo} shape="revolut">
                    Réserver
                  </EdgePremiumButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-8 space-y-4">
            {detail.faq.map((item) => (
              <div key={item.q} className="rounded-[20px] border border-[#050505]/8 bg-white p-6">
                <p className="font-medium">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#050505]/60">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#050505]/8 bg-[#050505] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-white">Prêt à former vos équipes ?</h2>
          <p className="mt-3 max-w-xl text-sm text-white/55">
            Réservez une session ou échangez avec un conseiller EDGE pour adapter cette formation à votre contexte.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={links.demo} variant="white" shape="revolut">
              Réserver maintenant
            </EdgePremiumButton>
            <EdgePremiumButton href={catalogHref} variant="outline-white" shape="revolut">
              Voir le catalogue <ChevronRight className="ml-1 h-4 w-4" />
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </div>
  );
}
