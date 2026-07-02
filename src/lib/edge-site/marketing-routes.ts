import { edgeLinkBase, edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";

/** Segments URL marketing (sans préfixe /edge-lab). */
export const EDGE_MARKETING_PATHS = {
  home: "/",
  decouvrir: "/#decouvrir-edge",
  apprenants: "/apprenants",
  formations: "/formations",
  formationsBts: "/formations/bts",
  formationsBachelor: "/formations/bachelor",
  formationsMastere: "/formations/mastere",
  alternance: "/alternance",
  admissions: "/admissions",
  financement: "/financement",
  vieEtudiante: "/vie-etudiante",
  certifications: "/certifications",
  business: "/business",
  businessFormerEquipes: "/business/former-vos-equipes",
  businessCatalogue: "/business/catalogue",
  businessParcoursSurMesure: "/business/parcours-sur-mesure",
  businessPresentielDistanciel: "/business/presentiel-distanciel",
  businessAcademie: "/business/academie-interne",
  businessCompetences: "/business/competences",
  businessPlansProgression: "/business/plans-progression",
  businessCertificationsBiz: "/business/certifications",
  businessOpenBadges: "/business/open-badges",
  businessDeveloppementTalents: "/business/developpement-talents",
  businessIdentifierTalents: "/business/identifier-talents",
  businessEvaluerCompetences: "/business/evaluer-competences",
  businessOnboarding: "/business/onboarding",
  businessMatchingCandidats: "/business/matching-candidats",
  businessTableauxDeBord: "/business/tableaux-de-bord",
  businessAnalytics: "/business/analytics",
  businessSuiviParcours: "/business/suivi-parcours",
  businessRoiFormation: "/business/roi-formation",
  businessAideDecision: "/business/aide-decision",
  businessSolutions: "/business/solutions",
  businessFormations: "/business/formations-entreprises",
  businessRecrutement: "/business/recrutement",
  businessCasClients: "/business/cas-clients",
  businessDemo: "/business/demo",
  online: "/online",
  onlineFormations: "/online/formations",
  onlineBootcamps: "/online/bootcamps",
  onlineCertifications: "/online/certifications",
  formateursExperts: "/formateurs-experts",
  expertSignup: "/signup/expert",
  expertDashboard: "/dashboard/expert",
  aPropos: "/a-propos",
  notreMission: "/notre-mission",
  ressources: "/ressources",
  blog: "/blog",
  guides: "/guides",
  webinaires: "/webinaires",
  tarifs: "/tarifs",
  contact: "/contact",
  login: "/login",
  parcours: "/parcours",
  entreprises: "/entreprises",
} as const;

export type EdgeMarketingRoutes = {
  [K in keyof typeof EDGE_MARKETING_PATHS]: string;
};

export function getEdgeMarketingRoutes(host?: string | null): EdgeMarketingRoutes {
  const base = edgeLinkBase(host);
  const mapPath = (path: string) => {
    if (!path.startsWith("/")) return path;
    if (path.includes("#")) {
      const [pathname, hash] = path.split("#");
      const href = edgeMarketingHref(pathname || "/", host);
      return `${href}#${hash}`;
    }
    return edgeMarketingHref(path, host);
  };

  return Object.fromEntries(
    Object.entries(EDGE_MARKETING_PATHS).map(([key, path]) => [key, mapPath(path)]),
  ) as EdgeMarketingRoutes;
}

/** Liens par défaut (dev local avec préfixe /edge-lab). */
export const EDGE_MARKETING_ROUTES = getEdgeMarketingRoutes(null);
