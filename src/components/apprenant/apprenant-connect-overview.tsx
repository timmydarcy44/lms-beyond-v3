"use client";

import Link from "next/link";
import { Bell, ChevronRight, Share2 } from "lucide-react";

import type { ApprenantPrimaryParcours } from "@/components/apprenant/apprenant-dashboard-client";
import {
  ApprenantAssessmentResults,
  type DiscScores,
} from "@/components/apprenant/apprenant-assessment-results";
import { ApprenantEdgeWalletSection } from "@/components/apprenant/apprenant-edge-wallet-section";
import { useApprenantShell } from "@/components/apprenant/apprenant-shell-context";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { ApprenantOpenBadgesSection } from "@/components/apprenant/apprenant-open-badges-section";
import type {
  LearnerEarnedOpenBadge,
  LearnerVisibleOpenBadge,
} from "@/lib/openbadges/learner-visible-badges";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_INTERACTIVE,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
  APPRENANT_HERO_CLASS,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_TITLE,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
  CONNECT_PROGRESS_FILL,
  CONNECT_PROGRESS_LABEL,
  CONNECT_PROGRESS_PCT,
  CONNECT_PROGRESS_TRACK,
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
  visibleOpenBadges?: LearnerVisibleOpenBadge[];
  earnedOpenBadges?: LearnerEarnedOpenBadge[];
  discScores?: DiscScores | null;
  idmcAxes?: Record<AxisKey, number> | null;
  softSkillsRadar?: Array<{ skill: string; score: number }>;
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
  visibleOpenBadges = [],
  earnedOpenBadges = [],
  discScores = null,
  idmcAxes = null,
  softSkillsRadar = [],
  onScrollToProfil,
  onOpenEditProfile,
}: Props) {
  const appShell = useApprenantShell();
  const pct = Math.max(0, Math.min(100, Math.round(profileCompletionPct)));
  const heroProgress = Math.min(100, Math.max(12, pct));
  const continueHref = primaryParcours?.href || catalogHref;
  const continueLabel = primaryParcours
    ? `Continuer ${primaryParcours.title}`
    : "Continuer le parcours";

  const badgesCount = earnedOpenBadges.length;
  const parcoursCount = primaryParcours ? 1 : 0;
  const discLabel = discScores
    ? (() => {
        const entries = Object.entries(discScores) as Array<[string, number]>;
        const top = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
        return top ? `DISC ${top}` : "DISC —";
      })()
    : "DISC —";

  return (
    <div className="mb-10 space-y-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className={APPRENANT_PAGE_KICKER}>Accueil</p>
          <h1 className={APPRENANT_PAGE_TITLE}>
            {greetingWord} {firstName}
          </h1>
          <p className={APPRENANT_PAGE_LEAD}>{tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          {onOpenEditProfile ? (
            <button type="button" onClick={onOpenEditProfile} className={CONNECT_BTN_SECONDARY}>
              Modifier mon profil
            </button>
          ) : null}
          <button type="button" onClick={onScrollToProfil} className={CONNECT_BTN_SECONDARY}>
            Ma fiche
            <ChevronRight className="h-4 w-4 opacity-70" />
          </button>
        </div>
      </header>

      {/* HERO (ordre impératif) */}
      <section
        className={APPRENANT_HERO_CLASS}
        style={{
          background:
            "linear-gradient(135deg, #0f1f4a 0%, #1a3a7a 30%, #0d1b3e 60%, #0D0D12 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(37,99,235,0.18) 0%, transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <p className={APPRENANT_CARD_KICKER}>Cockpit carrière</p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="text-[64px] font-extrabold leading-none tracking-[-0.04em] text-white">
                {pct}%
              </div>
              <p className="text-[13px] text-white/40">
                Score global (objectif : visibilité école/entreprise)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[13px]">
              {[
                { label: "Badges obtenus", value: String(badgesCount) },
                { label: "Parcours actif", value: String(parcoursCount) },
                { label: "Profil", value: discLabel },
              ].map((s, idx) => (
                <div key={s.label} className="flex items-center gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                      {s.label}
                    </div>
                    <div className="font-semibold text-white">{s.value}</div>
                  </div>
                  {idx < 2 ? (
                    <div className="h-8 w-px bg-white/10" aria-hidden />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tableau de bord — parcours en cours + barres + CTAs */}
      <section className={APPRENANT_CARD_BODY} data-cockpit-card>
        <p className={APPRENANT_CARD_KICKER}>Tableau de bord</p>
        <p className={APPRENANT_CARD_TITLE}>Parcours en cours</p>
        <p className={APPRENANT_CARD_MUTED}>
          Complétion du profil : {pct}% · Parcours (indicatif) : {heroProgress}%
        </p>
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <div className={`flex items-center justify-between ${CONNECT_PROGRESS_LABEL}`}>
              <span>Profil</span>
              <span className={CONNECT_PROGRESS_PCT}>{pct}%</span>
            </div>
            <div className={`${CONNECT_PROGRESS_TRACK} connect-progress-track`}>
              <div className={`${CONNECT_PROGRESS_FILL} connect-progress-fill`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`flex items-center justify-between ${CONNECT_PROGRESS_LABEL}`}>
              <span>Parcours</span>
              <span className={CONNECT_PROGRESS_PCT}>{heroProgress}%</span>
            </div>
            <div className={`${CONNECT_PROGRESS_TRACK} connect-progress-track`}>
              <div
                className={`${CONNECT_PROGRESS_FILL} connect-progress-fill opacity-60`}
                style={{ width: `${heroProgress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={continueHref} className={CONNECT_BTN_PRIMARY}>
            {continueLabel}
          </Link>
          <button type="button" onClick={onScrollToProfil} className={CONNECT_BTN_SECONDARY}>
            Compléter mon profil
          </button>
        </div>
      </section>

      {/* EDGE Wallet — badges obtenus (remonter ici) */}
      <ApprenantEdgeWalletSection badges={earnedOpenBadges} />

      {/* Accès rapides — grille 4 colonnes */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => void appShell?.sharePublicProfile()}
          className={`${APPRENANT_CARD_INTERACTIVE} text-left`}
        >
          <p className={APPRENANT_CARD_KICKER}>Profil public</p>
          <p className={APPRENANT_CARD_TITLE}>Partager ma page</p>
          <span className={APPRENANT_CARD_MUTED}>
            <Share2 className="mr-1 inline h-3.5 w-3.5" />
            Copier le lien /p/…
          </span>
        </button>
        <Link href={catalogHref} className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>Parcours</p>
          <p className={APPRENANT_CARD_TITLE}>EDGE Online</p>
          <span className={APPRENANT_CARD_MUTED}>Ouvrir le catalogue</span>
        </Link>
        <Link href={matchingHref} className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>Matching</p>
          <p className={APPRENANT_CARD_TITLE}>Opportunités</p>
          <span className={APPRENANT_CARD_MUTED}>Entreprises & offres</span>
        </Link>
        <Link href={resultsHref} className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>Suivi</p>
          <p className={APPRENANT_CARD_TITLE}>Mes résultats</p>
          <span className={APPRENANT_CARD_MUTED}>Tests & validations</span>
        </Link>
      </section>

      <ApprenantOpenBadgesSection badges={visibleOpenBadges} />

      {/* Mes résultats — DISC, IDMC, Soft Skills */}
      <ApprenantAssessmentResults
        variant="compact"
        firstName={firstName}
        discScores={discScores}
        idmcAxes={idmcAxes}
        softSkillsRadar={softSkillsRadar}
      />
    </div>
  );
}
