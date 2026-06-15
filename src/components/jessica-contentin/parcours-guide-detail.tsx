"use client";

import Link from "next/link";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";
import {
  AlertTriangle,
  Brain,
  CalendarDays,
  Heart,
  Home,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParcoursGuide } from "@/lib/jessica-contentin/parcours-guide-catalog";
import { parcoursGuideStepCount } from "@/lib/jessica-contentin/parcours-guide-catalog";
import { ParcoursGuideStartCta } from "@/components/jessica-contentin/parcours-guide-start-cta";
import { ParcoursDownloadResourcesSlider } from "@/components/jessica-contentin/parcours-download-resources-slider";
import { ParcoursGuideSyllabus } from "@/components/jessica-contentin/parcours-guide-syllabus";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const OBJECTIVE_ICONS = [Brain, AlertTriangle, LayoutGrid, CalendarDays, Home, Heart] as const;

const MODULE_ACCENTS = [
  "from-[#F5EDE3] to-[#FAF7F2]",
  "from-[#E8F0F5] to-[#F5FAFC]",
  "from-[#F0EBF5] to-[#FAF7FC]",
  "from-[#F5F0E8] to-[#FCFAF5]",
  "from-[#EBF5F0] to-[#F5FCF8]",
  "from-[#F5EBEB] to-[#FCF5F5]",
  "from-[#EBF0F5] to-[#F5F8FC]",
] as const;

type Props = {
  parcours: ParcoursGuide;
  hasAccess: boolean;
  catalogItemId: string | null;
  contentId: string | null;
  backHref?: string;
};

export function ParcoursGuideDetail({
  parcours,
  hasAccess,
  catalogItemId,
  contentId,
  backHref = "/jessica-contentin/parcours-guide",
}: Props) {
  const stepCount = parcoursGuideStepCount(parcours);
  const hasSections = Boolean(parcours.sections?.length);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      {/* Hero — texte à gauche, photo visible à droite */}
      <section className="relative overflow-hidden bg-[#2F2A25]">
        <div className="mx-auto grid min-h-[min(88vh,760px)] max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="relative z-10 flex flex-col justify-end px-4 pb-14 pt-28 md:px-8 md:pb-20 lg:pr-6">
            <Link
              href={backHref}
              className="mb-auto text-sm font-medium text-[#E8D5B5] underline-offset-4 hover:underline"
            >
              ← Parcours guidés
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#C6A664]">
              {parcours.kicker}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-[2.65rem]">
              {parcours.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/88">{parcours.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ParcoursGuideStartCta
                hasAccess={hasAccess}
                price={parcours.price}
                catalogItemId={catalogItemId}
                contentId={contentId}
                startHref={parcours.startHref ?? "/dashboard/apprenant"}
              />
              {!hasAccess ? (
                <p className="text-sm text-white/70">
                  Accès complet au parcours · {stepCount} {hasSections ? "sections" : "modules"} · outils
                  téléchargeables
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative min-h-[320px] lg:min-h-full">
            <JessicaRemoteImage
              src={parcours.imageUrl}
              alt={parcours.title}
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2F2A25] via-[#2F2A25]/35 to-transparent lg:from-[#2F2A25]/90 lg:via-[#2F2A25]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1510]/80 via-transparent to-[#2F2A25]/15 lg:hidden" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-14 md:px-8 md:py-20">
        {/* Intro */}
        <section className="space-y-4">
          {parcours.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-[#4A4339] md:text-lg">
              {paragraph}
            </p>
          ))}
        </section>

        {/* Objectifs avec icônes */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2F2A25] md:text-3xl">
            Objectifs du parcours
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {parcours.objectives.map((obj, index) => {
              const Icon = OBJECTIVE_ICONS[index % OBJECTIVE_ICONS.length];
              return (
                <div
                  key={obj}
                  className="flex gap-4 rounded-2xl border border-[#E6D9C6]/80 bg-white/80 p-5 shadow-sm shadow-[#2F2A25]/5 backdrop-blur-sm transition hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C6A664]/15 text-[#8B6914]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#4A4339]">{obj}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Programme */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2F2A25] md:text-3xl">
            {hasSections ? "Le programme" : "Les modules"}
          </h2>
          <p className="mt-2 text-[#5C5348]">
            {hasSections
              ? `${stepCount} sections structurées pour avancer à votre rythme.`
              : `${stepCount} étapes structurées pour avancer à votre rythme.`}
          </p>

          {hasSections && parcours.sections ? (
            <div className="mt-8">
              <ParcoursGuideSyllabus sections={parcours.sections} />
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {parcours.modules.map((mod, index) => (
                <article
                  key={mod.id}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl border border-white/60 p-6 shadow-[0_8px_40px_-12px_rgba(47,42,37,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-16px_rgba(47,42,37,0.22)]",
                    `bg-gradient-to-br ${MODULE_ACCENTS[index % MODULE_ACCENTS.length]}`,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-white/80 px-3 text-xs font-bold text-[#8B6914] shadow-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A7B52]/80">
                      Module
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-[#2F2A25]">{mod.title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {mod.items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-[#5C5348]">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C6A664]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        {parcours.downloadResourceSlides?.length ? (
          <ParcoursDownloadResourcesSlider slides={parcours.downloadResourceSlides} />
        ) : null}

        <section className="rounded-3xl border border-[#E6D9C6] bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-[#2F2A25]">Entretien expérientiel</h2>
          <p className="mt-4 leading-relaxed text-[#4A4339]">{parcours.entretien}</p>
        </section>

        <section className="rounded-3xl border border-[#C6A664]/30 bg-gradient-to-br from-[#FFFCF9] to-[#FAF3E8] p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C6A664]/15">
              <Sparkles className="h-5 w-5 text-[#C6A664]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2F2A25]">Assistant IA intégré</h2>
              <p className="mt-3 leading-relaxed text-[#4A4339]">
                Posez vos questions, reformulez les notions abordées et retrouvez facilement les outils proposés
                tout au long du parcours.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2F2A25]">Livrables</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parcours.livrables.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[#E6D9C6] bg-white px-4 py-3.5 text-sm text-[#4A4339] shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-[#2F2A25] p-8 text-white md:p-10">
          <h2 className="text-xl font-semibold md:text-2xl">Promesse du parcours</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/90">{parcours.promesse}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ParcoursGuideStartCta
              hasAccess={hasAccess}
              price={parcours.price}
              catalogItemId={catalogItemId}
              contentId={contentId}
              startHref={parcours.startHref ?? "/dashboard/apprenant"}
            />
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Prendre rendez-vous
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
