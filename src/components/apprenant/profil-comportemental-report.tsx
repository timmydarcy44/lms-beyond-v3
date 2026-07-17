"use client";

import Link from "next/link";
import { ProfileSynthesisCard } from "@/components/apprenant/profil-edge/hub/profile-synthesis-card";
import { ProfileResultsSummaryCard } from "@/components/apprenant/profil-edge/hub/profile-results-summary-card";
import { ProfileNavigationSection } from "@/components/apprenant/profil-edge/hub/profile-navigation-section";
import { HubSurface } from "@/components/apprenant/profil-edge/hub/hub-ui";
import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { useProfilEdgeHubData } from "@/hooks/use-profil-edge-hub-data";
import { APPRENANT_PAGE_SHELL, CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { useApprenantShell } from "@/components/apprenant/apprenant-shell-context";

/**
 * Vitrine « Mon Profil EDGE » — photographie professionnelle premium.
 */
export function ProfilComportementalReport() {
  const data = useProfilEdgeHubData();
  const shell = useApprenantShell();

  if (data.loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!data.discScores) {
    return (
      <EdgePageAmbiance ambiance="profile">
        <HubSurface tone="ocean" className="mx-auto max-w-lg space-y-5">
          <p className="text-[13px] font-medium text-white/70">Profil EDGE</p>
          <p className="text-[1.35rem] font-bold tracking-[-0.02em] text-white">
            Commencez par votre diagnostic comportemental
          </p>
          <p className="text-[15px] leading-relaxed text-white/80">
            Il ouvre votre photographie professionnelle, vos résultats et votre espace personnel.
          </p>
          <Link
            href="/dashboard/apprenant/test-comportemental-intro"
            className={`${CONNECT_BTN_PRIMARY} w-fit`}
          >
            Passer le test
          </Link>
        </HubSurface>
      </EdgePageAmbiance>
    );
  }

  return (
    <EdgePageAmbiance ambiance="profile">
      <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-[42rem] space-y-10 pb-20 md:max-w-3xl md:space-y-12`}>
        <header className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Mon Profil EDGE
          </p>
          <h1 className="text-[1.85rem] font-bold tracking-[-0.04em] text-white sm:text-[2.15rem]">
            Votre identité professionnelle
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/50">
            Résultats, compétences, expériences et preuves — votre vitrine EDGE.
          </p>
        </header>

        <ProfileSynthesisCard
          firstName={data.firstName}
          lastName={data.lastName}
          avatarUrl={data.avatarUrl}
          objectiveLabel={data.objectiveLabel}
          hasProject={data.hasProject}
          maturity={data.maturity}
          hardSkillsCount={data.hardSkills.length}
          badgeCountHint={data.badgeAwarded ? 1 : 0}
          badgeAwarded={data.badgeAwarded}
        />

        <ProfileNavigationSection
          maturity={data.maturity}
          testsDone={data.testsDone}
          experiencesCount={data.experiences.length}
          diplomasCount={data.diplomas.length}
          hardSkillsCount={data.hardSkills.length}
          projectLabel={data.hasProject ? data.objectiveLabel : null}
          badgeAwarded={data.badgeAwarded}
          badgeName={data.badgeName}
        />

        <ProfileResultsSummaryCard
          discScores={data.discScores}
          hasIdmc={data.hasIdmc}
          hasSoftSkills={data.hasSoftSkills}
          softSkillsScores={data.softSkillsScores}
          forcesCount={data.matching?.strengths.length ?? 0}
        />

        <HubSurface tone="quiet" className="space-y-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Profil public
          </p>
          <p className="text-[1.25rem] font-bold tracking-[-0.02em] text-white">
            Partagez votre Profil EDGE
          </p>
          <p className="text-[15px] leading-relaxed text-white/60">
            Un lien unique pour un recruteur, un partenaire ou un coach.
          </p>
          <button
            type="button"
            onClick={() => void shell?.sharePublicProfile?.()}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold text-black sm:w-auto"
          >
            Copier mon lien public
          </button>
        </HubSurface>
      </div>
    </EdgePageAmbiance>
  );
}
