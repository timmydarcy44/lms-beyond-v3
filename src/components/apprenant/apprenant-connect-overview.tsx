"use client";

import Link from "next/link";
import { Bell, BookOpen, Briefcase, ChevronRight, Share2, Star } from "lucide-react";

import type { ApprenantPrimaryParcours } from "@/components/apprenant/apprenant-dashboard-client";
import {
  ApprenantAssessmentResults,
  type DiscScores,
} from "@/components/apprenant/apprenant-assessment-results";
import { ApprenantEdgeWalletSection } from "@/components/apprenant/apprenant-edge-wallet-section";
import {
  useApprenantShell,
  useApprenantPageTokens,
} from "@/components/apprenant/apprenant-shell-context";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { ApprenantOpenBadgesSection } from "@/components/apprenant/apprenant-open-badges-section";
import { EdgeDashboardActionCard } from "@/components/edge/edge-dashboard-action-card";
import { EDGE_GRADIENTS } from "@/lib/edge/edge-brand";
import type {
  LearnerEarnedOpenBadge,
  LearnerVisibleOpenBadge,
} from "@/lib/openbadges/learner-visible-badges";

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
  /** Masque le hero principal — modules secondaires uniquement */
  compact?: boolean;
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
  compact = false,
}: Props) {
  const appShell = useApprenantShell();
  const t = useApprenantPageTokens();
  const isJessica = appShell?.variant === "jessica";
  const pct = Math.max(0, Math.min(100, Math.round(profileCompletionPct)));
  const heroProgress = Math.min(100, Math.max(12, pct));
  const continueHref = isJessica
    ? primaryParcours?.href || "/jessica-contentin/parcours-guide/enfant-tsa"
    : primaryParcours?.href || catalogHref;
  const continueLabel = primaryParcours
    ? `Continuer ${primaryParcours.title}`
    : isJessica
      ? "Découvrir le parcours TSA"
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

  const headerBorder = isJessica ? "border-[#D2B48C]/35" : "border-white/10";
  const notifyBtn = isJessica
    ? "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#C6A664]/35 bg-white/70 text-[#8B4513]/70 transition hover:bg-white hover:text-[#654321]"
    : "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition hover:bg-white/[0.05] hover:text-white";
  const notifyBadge = isJessica ? "bg-[#C6A664]" : "bg-[#3D7BFF]";

  const heroStyle = isJessica
    ? {
        background: "linear-gradient(135deg, #F8F5F0 0%, #F0EBE3 40%, #E8DCC8 100%)",
      }
    : {
        background: EDGE_GRADIENTS.dashboardHero,
      };

  const heroOverlay = isJessica
    ? {
        background: "radial-gradient(ellipse at 80% 50%, rgba(198,166,100,0.25) 0%, transparent 60%)",
      }
    : {
        background: "radial-gradient(ellipse at 85% 20%, rgba(110,150,255,0.35) 0%, transparent 65%)",
      };

  const heroPctClass = isJessica
    ? "text-4xl font-extrabold leading-none tracking-[-0.04em] text-[#2F2A25] sm:text-5xl lg:text-[64px]"
    : "text-4xl font-extrabold leading-none tracking-[-0.04em] text-white sm:text-5xl lg:text-[64px]";
  const heroMutedClass = isJessica ? "text-[13px] text-[#8B4513]/75" : "text-[13px] text-white/40";
  const statLabelClass = isJessica
    ? "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B4513]/60"
    : "text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40";
  const statValueClass = isJessica ? "font-semibold text-[#2F2A25]" : "font-semibold text-white";
  const statDividerClass = isJessica ? "h-8 w-px bg-[#D2B48C]/40" : "h-8 w-px bg-white/10";

  return (
    <div className={compact ? "space-y-6" : "mb-10 space-y-8"}>
      {!compact ? (
      <>
      <header className={`flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between ${headerBorder}`}>
        <div className="space-y-2">
          <p className={t.pageKicker}>Accueil</p>
          <h1 className={t.pageTitle}>
            {greetingWord} {firstName}
          </h1>
          <p className={t.pageLead}>{tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={notifyBtn} aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${notifyBadge}`}
            >
              3
            </span>
          </button>
          {onOpenEditProfile ? (
            <button type="button" onClick={onOpenEditProfile} className={t.btnSecondary}>
              Modifier mon profil
            </button>
          ) : null}
          <button type="button" onClick={onScrollToProfil} className={t.btnSecondary}>
            Ma fiche
            <ChevronRight className="h-4 w-4 opacity-70" />
          </button>
        </div>
      </header>

      <section className={`relative ${t.heroClass}`} style={heroStyle}>
        <div className="absolute inset-0" style={heroOverlay} aria-hidden />
        <div className="relative">
          <p className={t.cardKicker}>{isJessica ? "Espace parental" : "Cockpit carrière"}</p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className={heroPctClass}>{pct}%</div>
              <p className={heroMutedClass}>
                {isJessica
                  ? "Avancement de votre profil et de vos parcours"
                  : "Score global (objectif : visibilité école/entreprise)"}
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
                    <div className={statLabelClass}>{s.label}</div>
                    <div className={statValueClass}>{s.value}</div>
                  </div>
                  {idx < 2 ? <div className={statDividerClass} aria-hidden /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={t.cardBody} data-cockpit-card>
        <p className={t.cardKicker}>Tableau de bord</p>
        <p className={t.cardTitle}>Parcours en cours</p>
        <p className={t.cardMuted}>
          Complétion du profil : {pct}% · Parcours (indicatif) : {heroProgress}%
        </p>
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <div className={`flex items-center justify-between ${t.progressLabel}`}>
              <span>Profil</span>
              <span className={t.progressPct}>{pct}%</span>
            </div>
            <div className={`${t.progressTrack} connect-progress-track`}>
              <div className={`${t.progressFill} connect-progress-fill`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`flex items-center justify-between ${t.progressLabel}`}>
              <span>Parcours</span>
              <span className={t.progressPct}>{heroProgress}%</span>
            </div>
            <div className={`${t.progressTrack} connect-progress-track`}>
              <div
                className={`${t.progressFill} connect-progress-fill opacity-60`}
                style={{ width: `${heroProgress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={continueHref} className={t.btnPrimary}>
            {continueLabel}
          </Link>
          <button type="button" onClick={onScrollToProfil} className={t.btnSecondary}>
            Compléter mon profil
          </button>
        </div>
      </section>
      </>
      ) : (
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Explorer votre espace
        </p>
      )}

      <ApprenantEdgeWalletSection badges={earnedOpenBadges} />

      <section className={`grid gap-4 md:grid-cols-2 ${isJessica ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {isJessica ? (
          <>
            <button
              type="button"
              onClick={() => void appShell?.sharePublicProfile()}
              className={`${t.cardInteractive} text-left`}
            >
              <p className={t.cardKicker}>Profil public</p>
              <p className={t.cardTitle}>Partager ma page</p>
              <span className={t.cardMuted}>
                <Share2 className="mr-1 inline h-3.5 w-3.5" />
                Copier le lien /p/…
              </span>
            </button>
            <Link href="/jessica-contentin/parcours-guide" className={t.cardInteractive}>
              <p className={t.cardKicker}>Guidance</p>
              <p className={t.cardTitle}>Parcours guidé</p>
              <span className={t.cardMuted}>TSA & accompagnement parental</span>
            </Link>
            <Link href={badgesHref} className={t.cardInteractive}>
              <p className={t.cardKicker}>Wallet</p>
              <p className={t.cardTitle}>Mes badges</p>
              <span className={t.cardMuted}>Certifications & attestations</span>
            </Link>
            <Link href={resultsHref} className={t.cardInteractive}>
              <p className={t.cardKicker}>Suivi</p>
              <p className={t.cardTitle}>Mes résultats</p>
              <span className={t.cardMuted}>Tests & validations</span>
            </Link>
          </>
        ) : (
          <>
            <EdgeDashboardActionCard
              accent="blue"
              icon={Share2}
              eyebrow="Profil public"
              title="Partager ma page"
              subtitle="Copier le lien /p/…"
              onClick={() => void appShell?.sharePublicProfile()}
            />
            <EdgeDashboardActionCard
              accent="red"
              icon={BookOpen}
              eyebrow="Parcours"
              title="EDGE Online"
              subtitle="Ouvrir le catalogue"
              href={catalogHref}
            />
            <EdgeDashboardActionCard
              accent="green"
              icon={Briefcase}
              eyebrow="Matching"
              title="Opportunités"
              subtitle="Entreprises & offres"
              href={matchingHref}
            />
            <EdgeDashboardActionCard
              accent="violet"
              icon={Star}
              eyebrow="Suivi"
              title="Mes résultats"
              subtitle="Tests & validations"
              href={resultsHref}
            />
          </>
        )}
      </section>

      <ApprenantOpenBadgesSection badges={visibleOpenBadges} />

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
