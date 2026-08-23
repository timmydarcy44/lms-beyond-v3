import {
  PSG_ORG_ID,
  buildPsgEcoleDemoOverview,
  isPsgDemoViewer,
} from "@/lib/entreprise/psg-demo-data";
import type { loadSchoolOverviewData } from "@/lib/dashboard/ecole-overview-data";

type SchoolOverview = Awaited<ReturnType<typeof loadSchoolOverviewData>>;

export function shouldEnrichPsgEcoleDemo(
  schoolId: string | null | undefined,
  viewerEmail: string | null | undefined,
): boolean {
  return Boolean(schoolId === PSG_ORG_ID && isPsgDemoViewer(viewerEmail));
}

/** Remplit / complète l’overview école PSG pour les présentations. */
export function enrichPsgEcoleDemoOverview(overview: SchoolOverview): SchoolOverview {
  const demo = buildPsgEcoleDemoOverview();
  const thin =
    overview.effectifTotal < 8 ||
    overview.apprenants.length < 5 ||
    overview.latestOffers.length < 2;

  if (!thin) {
    return {
      ...overview,
      effectifTotal: Math.max(overview.effectifTotal, demo.effectifTotal),
      alternancesSignees: Math.max(overview.alternancesSignees, demo.alternancesSignees),
      apprenantsEnRecherche: Math.max(overview.apprenantsEnRecherche, demo.apprenantsEnRecherche),
      offersCount: Math.max(overview.offersCount, demo.offersCount),
    };
  }

  return {
    apprenants: overview.apprenants.length >= 5 ? overview.apprenants : demo.apprenants,
    entreprises: overview.entreprises.length >= 2 ? overview.entreprises : demo.entreprises,
    latestOffers: overview.latestOffers.length >= 2 ? overview.latestOffers : demo.latestOffers,
    latestConnected:
      overview.latestConnected.length >= 4 ? overview.latestConnected : demo.latestConnected,
    recentActivities:
      overview.recentActivities.length >= 3 ? overview.recentActivities : demo.recentActivities,
    offersCount: Math.max(overview.offersCount, demo.offersCount),
    effectifTotal: Math.max(overview.effectifTotal, demo.effectifTotal),
    alternancesSignees: Math.max(overview.alternancesSignees, demo.alternancesSignees),
    apprenantsEnRecherche: Math.max(overview.apprenantsEnRecherche, demo.apprenantsEnRecherche),
  };
}
