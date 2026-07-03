import { getEdgeMarketingRoutes, type EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";

/** Logo navbar / footer — asset local public. */
export const EDGE_LOGO_PATH = "/edge-lab/edge-logo-white.png";

export const EDGE_PREMIUM_IMAGES = {
  hero: EDGE_HERO_IMAGE_URL,
  video:
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=85",
  former:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=85",
  developper:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=85",
  recruter:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=85",
  certifier:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=85",
  apprenants:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=85",
  business:
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=85",
} as const;

export const EDGE_PREMIUM_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80",
] as const;

export const EDGE_PREMIUM_LOGOS = [
  "DECATHLON",
  "SUEZ",
  "VEOLIA",
  "BNP PARIBAS",
  "SNCF",
  "VINCI",
  "AIRBUS",
] as const;

export function getEdgePremiumConfig(host?: string | null) {
  const R = getEdgeMarketingRoutes(host);

  return {
    links: {
      apprenants: R.apprenants,
      business: R.business,
      particulier: R.particulier,
      tarifs: R.tarifs,
      login: R.login,
      contact: R.contact,
      demo: R.businessDemo,
      formations: R.formations,
      conseiller: R.contact,
      decouvrirEdge: R.decouvrir,
      expertSignup: R.expertSignup,
      expertDashboard: R.expertDashboard,
      formateursExperts: R.formateursExperts,
      home: R.home,
    },
    nav: {
      fonctionnalites: [
        { label: "Formations & parcours", href: R.formations },
        { label: "Alternance", href: R.alternance },
        { label: "Certifications", href: R.certifications },
        { label: "Formations en ligne", href: R.online },
      ],
      ressources: [
        { label: "Blog", href: R.blog },
        { label: "Guides", href: R.guides },
        { label: "Webinaires", href: R.webinaires },
        { label: "FAQ", href: R.contact },
      ],
    },
    megaApprenants: {
      headerTitle: "Découvrir EDGE Apprenants",
      headerHref: R.apprenants,
      columns: [
        {
          title: "Formations",
          links: [
            { label: "Titres professionnels (Bac+2)", href: R.formationsTitresPro },
            { label: "Bachelor (Bac+3)", href: R.formationsBachelor },
            { label: "Mastère (Bac+5)", href: R.formationsMastere },
            { label: "Bootcamps", href: R.onlineBootcamps },
            { label: "Spécialités", href: R.formationsSpecialites },
          ],
        },
        {
          title: "Parcours",
          links: [
            { label: "Alternance", href: R.alternance },
            { label: "Admissions", href: R.admissions },
            { label: "Financement", href: R.financement },
            { label: "Vie étudiante", href: R.vieEtudiante },
          ],
        },
        {
          title: "Réussir",
          links: [
            { label: "Entreprises partenaires", href: R.entreprises },
            { label: "Débouchés", href: R.apprenants },
            { label: "Certifications", href: R.certifications },
            { label: "Accompagnement personnalisé", href: R.contact },
          ],
        },
        {
          title: "Aide",
          links: [
            { label: "Trouver ma formation", href: R.formations },
            { label: "Prendre rendez-vous", href: R.contact },
            { label: "FAQ admissions", href: R.admissions },
            { label: "Contact", href: R.contact },
          ],
        },
      ],
    },
    megaBusiness: {
      headerTitle: "Découvrir EDGE Business",
      headerSubtitle:
        "Former, développer, recruter et piloter les compétences de vos équipes.",
      headerHref: R.business,
      columns: [
        {
          title: "Former",
          links: [
            { label: "Former vos équipes", href: R.businessFormerEquipes },
            { label: "Catalogue de formations", href: R.businessCatalogue },
            { label: "Parcours sur mesure", href: R.businessParcoursSurMesure },
            { label: "Présentiel & distanciel", href: R.businessPresentielDistanciel },
            { label: "Académie interne", href: R.businessAcademie },
          ],
        },
        {
          title: "Développer",
          links: [
            { label: "Cartographier les compétences", href: R.businessCompetences },
            { label: "Plans de progression", href: R.businessPlansProgression },
            { label: "Certifications", href: R.businessCertificationsBiz },
            { label: "Open Badges", href: R.businessOpenBadges },
            { label: "Développement des talents", href: R.businessDeveloppementTalents },
          ],
        },
        {
          title: "Recruter",
          links: [
            { label: "Identifier les talents", href: R.businessIdentifierTalents },
            { label: "Évaluer les compétences", href: R.businessEvaluerCompetences },
            { label: "Alternance", href: R.alternance },
            { label: "Onboarding", href: R.businessOnboarding },
            { label: "Matching candidats", href: R.businessMatchingCandidats },
          ],
        },
        {
          title: "Piloter",
          links: [
            { label: "Tableaux de bord", href: R.businessTableauxDeBord },
            { label: "Analytics", href: R.businessAnalytics },
            { label: "Suivi des parcours", href: R.businessSuiviParcours },
            { label: "ROI formation", href: R.businessRoiFormation },
            { label: "Aide à la décision", href: R.businessAideDecision },
          ],
        },
        {
          title: "Aide",
          links: [
            { label: "Demander une démo", href: R.businessDemo },
            { label: "Parler à un conseiller", href: R.contact },
            { label: "Cas clients", href: R.businessCasClients },
            { label: "Tarifs", href: R.tarifs },
          ],
        },
      ],
    },
    megaParticulier: {
      headerTitle: "Découvrir EDGE Particulier",
      headerSubtitle:
        "Certifications, montée en compétences et accompagnement de votre évolution professionnelle.",
      headerHref: R.particulier,
      columns: [
        {
          title: "Thématiques",
          links: [
            { label: "Certifications pro", href: R.particulierCertifications },
            { label: "IA", href: R.particulierIA },
            { label: "Management", href: R.particulierManagement },
            { label: "Vente", href: R.particulierVente },
            { label: "RH", href: R.particulierRh },
            { label: "Soft Skills", href: R.particulierSoftSkills },
          ],
        },
        {
          title: "Développer mes compétences",
          links: [
            { label: "Développer mes compétences", href: R.particulierDevelopper },
            { label: "EDGE Online", href: EDGE_ONLINE_EXTERNAL_URL },
            { label: "Micro-certifications", href: R.particulierMicroCertifications },
            { label: "Open Badges", href: R.particulierOpenBadges },
          ],
        },
        {
          title: "Financer",
          links: [
            { label: "CPF", href: R.particulierCpf },
            { label: "France Travail", href: R.particulierFranceTravail },
            { label: "OPCO", href: R.particulierOpco },
            { label: "Financement personnel", href: R.particulierFinancementPerso },
          ],
        },
        {
          title: "Évolution pro",
          links: [
            { label: "Reconversion", href: R.particulierReconversion },
            { label: "Coaching", href: R.particulierCoaching },
            { label: "Accompagnement individuel", href: R.particulierAccompagnement },
          ],
        },
      ],
    },
    routes: R,
  };
}

export type EdgePremiumConfig = ReturnType<typeof getEdgePremiumConfig>;

const DEFAULT_CONFIG = getEdgePremiumConfig(null);

export const EDGE_PREMIUM_LINKS = DEFAULT_CONFIG.links;

export const EDGE_PREMIUM_NAV = DEFAULT_CONFIG.nav;

export const EDGE_MEGA_APPRENANTS = DEFAULT_CONFIG.megaApprenants;

export const EDGE_MEGA_BUSINESS = DEFAULT_CONFIG.megaBusiness;

export const EDGE_MEGA_PARTICULIER = DEFAULT_CONFIG.megaParticulier;

export type EdgeMegaColumnsData =
  | EdgePremiumConfig["megaApprenants"]
  | EdgePremiumConfig["megaBusiness"]
  | EdgePremiumConfig["megaParticulier"];

export type EdgeMobileNavCategory = {
  id: string;
  label: string;
  links: { label: string; href: string }[];
};

export function getMobileNavCategories(config: EdgePremiumConfig): EdgeMobileNavCategory[] {
  const R = config.routes;
  return [
    {
      id: "apprenants",
      label: "Apprenants",
      links: [
        { label: "Titres professionnels (Bac+2)", href: R.formationsTitresPro },
        { label: "Bachelor (Bac+3)", href: R.formationsBachelor },
        { label: "Mastère (Bac+5)", href: R.formationsMastere },
        { label: "Bootcamps", href: R.onlineBootcamps },
        { label: "Spécialités", href: R.formationsSpecialites },
        { label: "Alternance", href: R.alternance },
        { label: "Admissions", href: R.admissions },
        { label: "Financement", href: R.financement },
        { label: "Vie étudiante", href: R.vieEtudiante },
      ],
    },
    {
      id: "business",
      label: "Business",
      links: [
        { label: "Former vos équipes", href: R.businessFormerEquipes },
        { label: "Catalogue de formations", href: R.businessCatalogue },
        { label: "Parcours sur mesure", href: R.businessParcoursSurMesure },
        { label: "Académie interne", href: R.businessAcademie },
        { label: "Recrutement", href: R.businessRecrutement },
        { label: "Pilotage", href: R.businessTableauxDeBord },
      ],
    },
    {
      id: "particulier",
      label: "Particulier",
      links: [
        { label: "Certifications pro", href: R.particulierCertifications },
        { label: "EDGE Online", href: R.particulierEdgeOnline },
        { label: "Soft Skills", href: R.particulierSoftSkills },
        { label: "CPF & financement", href: R.particulierCpf },
        { label: "Reconversion", href: R.particulierReconversion },
        { label: "Coaching", href: R.particulierCoaching },
      ],
    },
    {
      id: "fonctionnalites",
      label: "Fonctionnalités",
      links: [
        { label: "LMS", href: R.online },
        { label: "Certifications", href: R.certifications },
        { label: "Open Badges", href: R.businessOpenBadges },
        { label: "Analytics", href: R.businessAnalytics },
        { label: "Matching", href: R.businessMatchingCandidats },
        { label: "IA", href: R.businessFormerEquipes },
      ],
    },
    {
      id: "ressources",
      label: "Ressources",
      links: [
        { label: "Blog", href: R.blog },
        { label: "Guides", href: R.guides },
        { label: "Webinaires", href: R.webinaires },
        { label: "FAQ", href: R.contact },
        { label: "Formateurs / Experts", href: R.formateursExperts },
      ],
    },
    {
      id: "compte",
      label: "Compte",
      links: [
        { label: "Connexion", href: R.login },
        { label: "Découvrir EDGE", href: R.decouvrir },
      ],
    },
  ];
}

export type { EdgeMarketingRoutes };
