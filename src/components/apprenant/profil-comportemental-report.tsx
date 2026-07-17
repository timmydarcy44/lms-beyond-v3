"use client";

import Link from "next/link";
import { ProfileSynthesisCard } from "@/components/apprenant/profil-edge/hub/profile-synthesis-card";
import { ProfileResultsSummaryCard } from "@/components/apprenant/profil-edge/hub/profile-results-summary-card";
import { ProfileNavigationSection } from "@/components/apprenant/profil-edge/hub/profile-navigation-section";
import { SkillsSummaryCard } from "@/components/apprenant/profil-edge/hub/skills-summary-card";
import { AchievementsCard } from "@/components/apprenant/profil-edge/hub/achievements-card";
import { HubSectionHeader, HubSurface } from "@/components/apprenant/profil-edge/hub/hub-ui";
import { useProfilEdgeHubData } from "@/hooks/use-profil-edge-hub-data";
import { APPRENANT_PAGE_SHELL, CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import type { StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";

/**
 * Photographie professionnelle « Mon Profil EDGE » :
 * qui je suis, mes résultats, mes preuves.
 */
export function ProfilComportementalReport() {
  const data = useProfilEdgeHubData();

  if (data.loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!data.discScores) {
    return (
      <HubSurface tone="slate" className="mx-auto max-w-lg space-y-5">
        <p className="text-[13px] font-medium text-white/55">Profil EDGE</p>
        <p className="text-[17px] leading-relaxed text-white/80">
          Complétez d&apos;abord le test comportemental pour accéder à votre photographie professionnelle.
        </p>
        <Link
          href="/dashboard/apprenant/test-comportemental-intro"
          className={`${CONNECT_BTN_PRIMARY} w-fit`}
        >
          Passer le test
        </Link>
      </HubSurface>
    );
  }

  return (
    <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-[42rem] space-y-10 pb-20 md:max-w-3xl md:space-y-12`}>
      <header className="space-y-2">
        <p className="text-[13px] text-white/40">
          Retrouvez votre identité professionnelle, vos résultats, vos compétences et vos preuves.
        </p>
        <h1 className="sr-only">Mon Profil EDGE</h1>
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

      <ProfileResultsSummaryCard
        discScores={data.discScores}
        hasIdmc={data.hasIdmc}
        hasSoftSkills={data.hasSoftSkills}
        softSkillsScores={data.softSkillsScores}
        forcesCount={data.matching?.strengths.length ?? 0}
      />

      <SkillsSummaryCard
        hardSkills={data.hardSkills}
        skillsMetadata={data.skillsMetadata as Record<string, StoredHardSkillMeta>}
      />

      <section>
        <HubSectionHeader
          title="Expériences et diplômes"
          subtitle="Votre parcours déclaré — les détails se gèrent dans chaque section."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <HubSurface tone="quiet" href="/dashboard/apprenant/profil-comportemental/experiences" className="!p-5">
            <p className="text-[13px] text-white/45">Expériences</p>
            <p className="mt-2 text-[1.75rem] font-bold tabular-nums text-white">
              {data.experiences.length}
            </p>
            <p className="mt-1 text-[13px] text-white/50">
              {data.experiences.length ? "Voir mon parcours" : "Ajouter une expérience"}
            </p>
          </HubSurface>
          <HubSurface tone="quiet" href="/dashboard/apprenant/profil-comportemental/diplomes" className="!p-5">
            <p className="text-[13px] text-white/45">Diplômes</p>
            <p className="mt-2 text-[1.75rem] font-bold tabular-nums text-white">
              {data.diplomas.length}
            </p>
            <p className="mt-1 text-[13px] text-white/50">
              {data.diplomas.length ? "Voir mes diplômes" : "Ajouter un diplôme"}
            </p>
          </HubSurface>
        </div>
      </section>

      <AchievementsCard
        testsComplete={data.profilTestsComplete}
        badgeAwarded={data.badgeAwarded}
        badgeName={data.badgeName}
      />

      <ProfileNavigationSection
        maturity={data.maturity}
        testsDone={data.testsDone}
        experiencesCount={data.experiences.length}
        diplomasCount={data.diplomas.length}
        hardSkillsCount={data.hardSkills.length}
        projectLabel={data.hasProject ? data.objectiveLabel : null}
      />

      <HubSurface tone="quiet" className="space-y-3 !p-5">
        <p className="text-[13px] text-white/45">Profil public</p>
        <p className="text-[15px] leading-relaxed text-white/70">
          Partagez une version publique de votre Profil EDGE avec un recruteur ou un partenaire.
        </p>
        <p className="text-[13px] text-white/40">
          Utilisez « Partager mon profil » dans le menu pour copier le lien.
        </p>
      </HubSurface>
    </div>
  );
}
