"use client";

import Link from "next/link";
import { EvolutionAbstractHeroCard } from "@/components/apprenant/profil-edge/hub/evolution-abstract-hero-card";
import { DailyMissionHeroCard } from "@/components/apprenant/profil-edge/hub/daily-mission-hero-card";
import { ProfileProgressCard } from "@/components/apprenant/profil-edge/hub/profile-progress-card";
import { ExpertCoachingCard } from "@/components/apprenant/profil-edge/hub/expert-coaching-card";
import { HubSurface } from "@/components/apprenant/profil-edge/hub/hub-ui";
import { ProfilEdgeHubGaps } from "@/components/apprenant/profil-edge/profil-edge-hub-gaps";
import { extractCareerTitleFromProject } from "@/lib/particulier/professional-project-fields";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { useProfilEdgeHubData } from "@/hooks/use-profil-edge-hub-data";
import { APPRENANT_PAGE_SHELL, CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";

/**
 * Page quotidienne « Mon évolution » :
 * où je vais, où j’en suis, que faire maintenant.
 */
export function MonEvolutionReport() {
  const data = useProfilEdgeHubData();

  if (data.loading && !data.discScores) {
    return (
      <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-[42rem] space-y-8 pb-20 md:max-w-3xl`}>
        <EvolutionAbstractHeroCard
          objectiveLabel=""
          matching={null}
          hasProject={false}
          loading
        />
      </div>
    );
  }

  if (data.error && !data.discScores && !data.hasProject) {
    return (
      <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-[42rem] space-y-8 pb-20 md:max-w-3xl`}>
        <EvolutionAbstractHeroCard
          objectiveLabel=""
          matching={null}
          hasProject={false}
          error={data.error}
        />
      </div>
    );
  }

  if (!data.discScores) {
    return (
      <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-[42rem] space-y-8 pb-20 md:max-w-3xl`}>
        <EvolutionAbstractHeroCard
          objectiveLabel={data.objectiveLabel}
          referentialTitle={data.selectedCareer?.title ?? null}
          matching={null}
          hasProject={data.hasProject}
        />
        <HubSurface tone="slate" className="space-y-4">
          <p className="text-[13px] font-medium text-white/55">Pour démarrer</p>
          <h2 className="text-[1.35rem] font-bold tracking-[-0.02em] text-white">
            Complétez d&apos;abord votre diagnostic comportemental
          </h2>
          <p className="text-[15px] leading-relaxed text-white/65">
            Le test DISC active l’alignement métier, la mission du jour et votre plan d’action.
          </p>
          <Link
            href="/dashboard/apprenant/test-comportemental-intro"
            className={`${CONNECT_BTN_PRIMARY} w-fit`}
          >
            Passer le test
          </Link>
        </HubSurface>
      </div>
    );
  }

  return (
    <div className={`${APPRENANT_PAGE_SHELL} mx-auto max-w-[42rem] space-y-10 pb-20 md:max-w-3xl md:space-y-12`}>
      <header className="space-y-1">
        <p className="text-[13px] text-white/40">Où vous allez · ce que vous faites maintenant</p>
        <h1 className="sr-only">Mon évolution</h1>
      </header>

      <EvolutionAbstractHeroCard
        objectiveLabel={data.objectiveLabel}
        referentialTitle={data.selectedCareer?.title ?? null}
        matching={data.matching}
        hasProject={data.hasProject}
        error={data.error}
      />

      {!data.selectedCareer &&
      extractCareerTitleFromProject(data.typeProfil, data.professionalProject) ? (
        <HubSurface tone="slate" className="text-[15px] leading-relaxed text-white/70">
          Votre projet n&apos;a pas encore été analysé.{" "}
          <Link
            href={PROFIL_EDGE_SECTION_HREFS.projet}
            className="font-semibold text-white underline underline-offset-2"
          >
            Enregistrez votre projet professionnel
          </Link>{" "}
          pour activer l&apos;alignement métier.
        </HubSurface>
      ) : null}

      {data.matching && data.selectedCareer ? (
        <div id="ma-mission" className="scroll-mt-24">
          <DailyMissionHeroCard matching={data.matching} objective={data.objectiveLabel} />
        </div>
      ) : null}

      <ProfileProgressCard maturity={data.maturity} />

      {data.matching && data.selectedCareer ? (
        <section id="plan-action" className="scroll-mt-24 space-y-4">
          <ProfilEdgeHubGaps matching={data.matching} objectiveLabel={data.objectiveLabel} />
        </section>
      ) : null}

      {data.matching && data.selectedCareer ? <ExpertCoachingCard /> : null}
    </div>
  );
}
