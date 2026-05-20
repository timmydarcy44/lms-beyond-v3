"use client";

import Link from "next/link";
import { Bell, ChevronRight, Sparkles } from "lucide-react";

import type { ApprenantPrimaryParcours } from "@/components/apprenant/apprenant-dashboard-client";
import {
  APPRENANT_CARD_CLASS,
  APPRENANT_MAIN_CARD_CLASS,
  CONNECT_BADGE_LOCKED,
  CONNECT_BADGE_TITLE,
  CONNECT_BTN_OUTLINE,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
  CONNECT_CARD_INNER,
  CONNECT_CARD_ACTIVE,
  CONNECT_FILTER_ACTIVE,
  CONNECT_FILTER_INACTIVE,
  CONNECT_GOAL_STRIP,
  CONNECT_GOAL_TEXT,
  CONNECT_HERO_TITLE,
  CONNECT_LABEL_UPPER,
  CONNECT_PROFILE_CIRCLE_CAPTION,
  CONNECT_PROFILE_CIRCLE_LABEL,
  CONNECT_PROFILE_CIRCLE_PCT,
  CONNECT_PROGRESS_FILL,
  CONNECT_PROGRESS_LABEL,
  CONNECT_PROGRESS_PCT,
  CONNECT_PROGRESS_TRACK,
  CONNECT_SECTION_SUBTITLE,
  CONNECT_SECTION_TITLE,
  CONNECT_TAG_CATEGORY,
  CONNECT_TEXT_SECONDARY,
  CONNECT_TEXT_TERTIARY,
} from "@/lib/apprenant/connect-nav";

type Props = {
  firstName: string;
  greetingWord: string;
  tagline: string;
  profileCompletionPct: number;
  catalogHref: string;
  primaryParcours?: ApprenantPrimaryParcours | null;
  badgesHref: string;
  resultsHref: string;
  matchingHref: string;
  careerHref: string;
  onScrollToProfil: () => void;
  onOpenEditProfile?: () => void;
};

export function ApprenantConnectOverview({
  firstName,
  greetingWord,
  tagline,
  profileCompletionPct,
  catalogHref,
  primaryParcours,
  badgesHref,
  resultsHref,
  matchingHref,
  careerHref,
  onScrollToProfil,
  onOpenEditProfile,
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(profileCompletionPct)));
  const heroProgress = Math.min(100, Math.max(12, pct));
  const continueHref = primaryParcours?.href || catalogHref;
  const continueLabel = primaryParcours
    ? `Continuer ${primaryParcours.title}`
    : "Continuer le parcours";

  return (
    <div className="mb-10 space-y-8">
      <header className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-[#0a0a0a] sm:text-3xl">
            {greetingWord} {firstName}
          </h1>
          <p className="mt-1 text-sm text-black/60">{tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-transparent text-black/50 transition hover:border-black/25"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          {onOpenEditProfile ? (
            <button type="button" onClick={onOpenEditProfile} className={CONNECT_BTN_SECONDARY}>
              Modifier mon profil
            </button>
          ) : null}
          <button type="button" onClick={onScrollToProfil} className={CONNECT_BTN_SECONDARY}>
            Voir ma fiche
            <ChevronRight className="h-4 w-4 opacity-70" />
          </button>
        </div>
      </header>

      <section className={`${APPRENANT_MAIN_CARD_CLASS} overflow-hidden`}>
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="flex flex-col justify-center gap-5">
            <p className={CONNECT_LABEL_UPPER}>Parcours en cours</p>
            <div>
              <h2 className={CONNECT_HERO_TITLE}>Votre progression EDGE</h2>
              <p className={`mt-2 max-w-lg ${CONNECT_TEXT_SECONDARY}`}>
                Poursuivez votre parcours assigné ou complétez votre profil pour débloquer toutes les
                opportunités.
              </p>
            </div>
            <div className="space-y-2">
              <div className={`flex items-center justify-between ${CONNECT_PROGRESS_LABEL}`}>
                <span>Complétion du profil</span>
                <span className={CONNECT_PROGRESS_PCT}>{pct}%</span>
              </div>
              <div className={CONNECT_PROGRESS_TRACK}>
                <div className={CONNECT_PROGRESS_FILL} style={{ width: `${pct}%` }} />
              </div>
              <div className={`flex items-center justify-between ${CONNECT_PROGRESS_LABEL}`}>
                <span>Parcours catalogue (indicatif)</span>
                <span className={CONNECT_PROGRESS_PCT}>{heroProgress}%</span>
              </div>
              <div className={CONNECT_PROGRESS_TRACK}>
                <div className={`${CONNECT_PROGRESS_FILL} opacity-80`} style={{ width: `${heroProgress}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={continueHref} className={CONNECT_BTN_PRIMARY}>
                {continueLabel}
              </Link>
              <button type="button" onClick={onScrollToProfil} className={CONNECT_BTN_SECONDARY}>
                Compléter mon profil
              </button>
            </div>
          </div>

          <div className={`${CONNECT_CARD_INNER} flex flex-col items-center justify-center gap-4`}>
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#FF3B30 ${pct * 3.6}deg, rgba(0,0,0,0.1) 0deg)`,
              }}
            >
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white text-center">
                <div className={CONNECT_PROFILE_CIRCLE_PCT}>{pct}%</div>
                <div className={CONNECT_PROFILE_CIRCLE_LABEL}>Profil global</div>
              </div>
            </div>
            <p className={CONNECT_PROFILE_CIRCLE_CAPTION}>
              Objectif : identité complète, tests et soft skills pour votre visibilité auprès des écoles et
              entreprises.
            </p>
          </div>
        </div>

        <div className={CONNECT_GOAL_STRIP}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={CONNECT_LABEL_UPPER}>Prochain objectif</p>
              <p className={CONNECT_GOAL_TEXT}>Finaliser votre fiche et lancer les parcours recommandés.</p>
            </div>
            <Link href={resultsHref} className={`${CONNECT_BTN_OUTLINE} shrink-0 gap-2 text-xs`}>
              Voir mes résultats
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className={APPRENANT_CARD_CLASS}>
          <h3 className={CONNECT_SECTION_TITLE}>Reprendre là où vous en étiez</h3>
          <p className={`mt-1 ${CONNECT_SECTION_SUBTITLE}`}>
            Dernière activité — poursuivez votre parcours ou vos tests.
          </p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className={`${CONNECT_CARD_INNER} flex-1`}>
              <div className="text-xs font-medium text-black/60">Catalogue & parcours</div>
              <p className={`mt-2 ${CONNECT_TEXT_SECONDARY}`}>
                Accédez aux modules EDGE Online et suivez votre progression.
              </p>
              <div className={`mt-4 ${CONNECT_PROGRESS_TRACK} h-1.5`}>
                <div className={`${CONNECT_PROGRESS_FILL} w-[45%]`} />
              </div>
              <Link href={catalogHref} className="mt-4 inline-flex text-xs font-medium text-[#FF3B30] hover:underline">
                Ouvrir le catalogue →
              </Link>
            </div>
            <div className={`${CONNECT_CARD_ACTIVE} flex w-full shrink-0 flex-col justify-between sm:max-w-[220px]`}>
              <div className={CONNECT_TEXT_TERTIARY}>Raccourci</div>
              <Link href={careerHref} className={`${CONNECT_BTN_SECONDARY} mt-3 w-full text-center text-xs`}>
                Ma carrière & missions
              </Link>
            </div>
          </div>
        </section>

        <section className={APPRENANT_CARD_CLASS}>
          <h3 className={CONNECT_SECTION_TITLE}>Mes badges</h3>
          <p className={`mt-1 ${CONNECT_SECTION_SUBTITLE}`}>Compétences reconnues sur la plateforme.</p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {["Communication", "Organisation", "Leadership"].map((label) => (
              <div
                key={label}
                className="min-w-[120px] shrink-0 rounded-lg border border-black/[0.06] bg-white p-4 text-center"
              >
                <Sparkles className="mx-auto h-6 w-6 text-black/20" strokeWidth={1.5} />
                <div className={CONNECT_BADGE_TITLE}>{label}</div>
                <div className={CONNECT_BADGE_LOCKED}>À débloquer</div>
              </div>
            ))}
            <Link
              href={badgesHref}
              className="flex min-w-[100px] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-black/[0.06] bg-white text-xs font-medium text-black/45 transition hover:border-[#FF3B30]/40 hover:text-[#FF3B30]"
            >
              <span className="text-2xl leading-none text-black/25">+</span>
              <span className="mt-2">Tous les badges</span>
            </Link>
          </div>
        </section>
      </div>

      <section className={APPRENANT_CARD_CLASS}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className={CONNECT_SECTION_TITLE}>Mes parcours</h3>
            <p className={`mt-1 ${CONNECT_SECTION_SUBTITLE}`}>Filtrez et accédez rapidement au catalogue.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["En cours", "Recommandés", "À terminer", "Nouveautés"].map((tab, i) => (
              <span key={tab} className={i === 0 ? CONNECT_FILTER_ACTIVE : CONNECT_FILTER_INACTIVE}>
                {tab}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "EDGE Online", tag: "Catalogue", desc: "Parcours métiers & compétences digitales.", href: catalogHref },
            { title: "Soft skills", tag: "À faire", desc: "Passez l’évaluation comportementale.", href: "/dashboard/apprenant/soft-skills-intro" },
            { title: "Test DISC", tag: "Profil", desc: "Comprenez votre style de travail.", href: "/dashboard/apprenant/test-comportemental-intro" },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`${CONNECT_CARD_INNER} group relative block transition hover:border-[rgba(255,59,48,0.15)]`}
            >
              <span className={CONNECT_TAG_CATEGORY}>{card.tag}</span>
              <div className="mt-2 text-base font-medium text-[#0a0a0a]">{card.title}</div>
              <p className={`mt-2 text-xs ${CONNECT_SECTION_SUBTITLE}`}>{card.desc}</p>
              <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-[#FF3B30]" />
            </Link>
          ))}
        </div>
      </section>

      <section className={APPRENANT_CARD_CLASS}>
        <h3 className={CONNECT_SECTION_TITLE}>À explorer ensuite</h3>
        <p className={`mt-1 max-w-3xl ${CONNECT_SECTION_SUBTITLE}`}>
          Raccourcis vers le catalogue, le matching et la carrière.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { k: "Catalogue", sub: "PARCOURS", meta: "EDGE Online", href: catalogHref },
            { k: "Opportunités", sub: "MATCHING", meta: "Entreprises & offres", href: matchingHref },
            { k: "Carrière", sub: "MISSIONS", meta: "CV & entretiens", href: careerHref },
          ].map((x) => (
            <Link
              key={x.k}
              href={x.href}
              className={`${CONNECT_CARD_INNER} transition hover:border-[rgba(255,59,48,0.15)]`}
            >
              <div className={CONNECT_TAG_CATEGORY}>{x.sub}</div>
              <div className="mt-2 text-lg font-medium text-[#0a0a0a]">{x.k}</div>
              <div className={`mt-3 text-xs ${CONNECT_SECTION_SUBTITLE}`}>{x.meta}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className={APPRENANT_CARD_CLASS}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={CONNECT_LABEL_UPPER}>Agenda</p>
            <p className={`mt-1 ${CONNECT_TEXT_SECONDARY}`}>
              Planifiez vos entretiens et suivis carrière depuis l’espace dédié.
            </p>
          </div>
          <Link href={careerHref} className={`${CONNECT_BTN_PRIMARY} shrink-0`}>
            Voir ma carrière
          </Link>
        </div>
      </div>
    </div>
  );
}
