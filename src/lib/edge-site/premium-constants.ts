import { getEdgeMarketingRoutes, type EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";
import { getPillarMegaMenus } from "@/lib/edge-site/pillar-mega-menu-data";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";

/** Logo navbar / footer — Byound blanc (chrome sombre). */
export const EDGE_LOGO_PATH =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_byound_blanc_sans_fond.png";

/** Logo Byound pour chrome clair (même asset, teinté noir côté composant). */
export const EDGE_LOGO_BLACK_PATH =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_byound_blanc_sans_fond.png";

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
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=85",
  apprenants:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=85",
  business:
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=85",
  /** Capture UI test comportemental (téléphone). */
  diagComportemental:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/DIAG_IDMC.png",
} as const;

/** Vidéo carte « Valorisations des compétences » (home). */
export const EDGE_PREMIUM_OPEN_BADGES_VIDEO =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/presentation%20OB.mp4";

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
      /** @deprecated Conservé pour compat — piliers Business historiques. */
      pillars: [
        {
          id: "former" as const,
          label: "Former",
          href: R.businessFormerEquipes,
          items: [
            { label: "Former vos équipes", href: R.businessFormerEquipes },
            { label: "Parcours sur mesure", href: R.businessParcoursSurMesure },
            { label: "Intra-entreprise", href: R.businessFormerEquipes },
            { label: "Inter-entreprises", href: R.businessFormerEquipes },
            { label: "Blended learning", href: R.businessPresentielDistanciel },
          ],
        },
        {
          id: "developper" as const,
          label: "Développer",
          href: R.businessDiagnostics,
          items: [
            { label: "Diagnostics de compétences", href: R.businessDiagnostics },
            { label: "Cartographier les compétences", href: R.businessCompetences },
            { label: "Plans de progression", href: R.businessPlansProgression },
            { label: "Certifications", href: R.businessCertificationsBiz },
            { label: "Open Badges", href: R.businessOpenBadges },
          ],
        },
        {
          id: "recruter" as const,
          label: "Recruter",
          href: R.businessRecrutement,
          items: [
            { label: "Identifier les talents", href: R.businessIdentifierTalents },
            { label: "Évaluer les compétences", href: R.businessEvaluerCompetences },
            { label: "Matching compétences", href: R.businessRecrutement },
            { label: "Onboarding", href: R.businessOnboarding },
          ],
        },
        {
          id: "piloter" as const,
          label: "Piloter",
          href: R.businessTableauxDeBord,
          items: [
            { label: "Tableaux de bord", href: R.businessTableauxDeBord },
            { label: "Analytics", href: R.businessAnalytics },
            { label: "ROI formation", href: R.businessRoiFormation },
            { label: "Aide à la décision", href: R.businessAideDecision },
          ],
        },
      ],
      /** Plateforme Byound — outils & preuves de compétences. */
      plateforme: [
        { label: "Profil & progression", href: R.particulier },
        { label: "Open Badges", href: R.businessOpenBadges },
        { label: "Diagnostics de compétences", href: R.businessDiagnostics },
        { label: "Certifications", href: R.certifications },
        { label: "Tarifs", href: R.tarifs },
      ],
      /** @deprecated Alias — utiliser `plateforme`. */
      fonctionnalites: [
        { label: "Profil & progression", href: R.particulier },
        { label: "Certifications", href: R.certifications },
        { label: "Open Badges", href: R.businessOpenBadges },
        { label: "Diagnostics", href: R.businessDiagnostics },
      ],
      ressources: [
        { label: "Blog", href: R.blog },
        { label: "Guides", href: R.guides },
        { label: "Webinaires", href: R.webinaires },
        { label: "FAQ", href: R.contact },
      ],
      /** Mega-menus compacts (legacy pillars — conservés pour pages internes). */
      pillarMegaMenus: getPillarMegaMenus(R),
    },
    megaApprenants: {
      headerTitle: "Byound School",
      headerHref: R.alternance,
      actions: [
        { label: "Créer un compte", href: "/particuliers#signup", primary: true },
        { label: "Accéder à mon espace", href: "/particuliers/login", primary: false },
      ],
      columns: [
        {
          title: "Parcours",
          links: [
            { label: "Découvrir l'alternance", href: R.alternance, featured: true },
            { label: "Titres professionnels (Bac+2)", href: R.formationsTitresPro },
            { label: "Bachelor (Bac+3)", href: R.formationsBachelor },
            { label: "Mastère (Bac+5)", href: R.formationsMastere },
          ],
        },
        {
          title: "CFA Byound",
          links: [
            { label: "Ouverture prévue — rentrée 2027", href: R.alternance, featured: true },
            { label: "Manifestez votre intérêt", href: R.contact },
            { label: "Financement", href: R.financement },
            { label: "Vie étudiante", href: R.vieEtudiante },
          ],
        },
        {
          title: "Réussir",
          links: [
            { label: "Entreprises partenaires", href: R.entreprises },
            { label: "Certifications", href: R.certifications },
            { label: "Accompagnement", href: R.contact },
          ],
        },
        {
          title: "Aide",
          links: [
            { label: "Admissions", href: R.admissions },
            { label: "Prendre rendez-vous", href: R.contact },
            { label: "Contact", href: R.contact },
          ],
        },
      ],
    },
    megaBusiness: {
      headerTitle: "Byound Business",
      headerSubtitle:
        "Former, développer, recruter et piloter les compétences de vos équipes.",
      headerHref: R.business,
      columns: [
        {
          title: "Former",
          links: [
            { label: "Former vos équipes", href: R.businessFormerEquipes, featured: true },
            { label: "Parcours sur mesure", href: R.businessParcoursSurMesure },
            { label: "Intra-entreprise", href: R.businessFormerEquipes },
            { label: "Inter-entreprises", href: R.businessFormerEquipes },
            { label: "Blended learning", href: R.businessPresentielDistanciel },
          ],
        },
        {
          title: "Développer",
          links: [
            { label: "Diagnostics de compétences", href: R.businessDiagnostics, featured: true },
            { label: "Cartographier les compétences", href: R.businessCompetences },
            { label: "Plans de progression", href: R.businessPlansProgression },
            { label: "Certifications", href: R.businessCertificationsBiz },
            { label: "Open Badges", href: R.businessOpenBadges, featured: true },
          ],
        },
        {
          title: "Recruter",
          links: [
            { label: "Identifier les talents", href: R.businessIdentifierTalents },
            { label: "Évaluer les compétences", href: R.businessEvaluerCompetences },
            { label: "Matching compétences", href: R.businessRecrutement },
            { label: "Onboarding", href: R.businessOnboarding },
          ],
        },
        {
          title: "Piloter",
          links: [
            { label: "Tableaux de bord", href: R.businessTableauxDeBord },
            { label: "Analytics", href: R.businessAnalytics },
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
      headerTitle: "Byound Life",
      headerSubtitle:
        "Bootcamps, formations courtes et parcours pour développer vos compétences — aujourd’hui et à venir.",
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
            { label: "Byound Online", href: EDGE_ONLINE_EXTERNAL_URL },
            { label: "Micro-certifications", href: R.particulierMicroCertifications },
            { label: "Open Badges", href: R.particulierOpenBadges, featured: true },
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
      id: "alternants",
      label: "Alternants",
      links: config.megaApprenants.columns.flatMap((col) =>
        col.links.map((link) => ({ label: link.label, href: link.href })),
      ),
    },
    {
      id: "entreprises",
      label: "Entreprises",
      links: config.megaBusiness.columns.flatMap((col) =>
        col.links.map((link) => ({ label: link.label, href: link.href })),
      ),
    },
    {
      id: "particuliers",
      label: "Particuliers",
      links: config.megaParticulier.columns.flatMap((col) =>
        col.links.map((link) => ({ label: link.label, href: link.href })),
      ),
    },
    {
      id: "plateforme",
      label: "La plateforme",
      links: [...config.nav.plateforme],
    },
    {
      id: "a-propos",
      label: "À propos",
      links: [{ label: "À propos", href: R.aPropos }],
    },
    {
      id: "compte",
      label: "Compte",
      links: [
        { label: "Connexion", href: R.login },
        { label: "Découvrir l'alternance", href: R.alternance },
      ],
    },
  ];
}

export type { EdgeMarketingRoutes };
