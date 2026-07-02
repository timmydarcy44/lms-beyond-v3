import { getEdgeMarketingRoutes, type EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";

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
            { label: "BTS", href: R.formationsBts },
            { label: "Bachelor", href: R.formationsBachelor },
            { label: "Mastère", href: R.formationsMastere },
            { label: "Formations en ligne", href: R.onlineFormations },
            { label: "Bootcamps", href: R.onlineBootcamps },
          ],
        },
        {
          title: "Parcours",
          links: [
            { label: "Alternance", href: R.alternance },
            { label: "Formation initiale", href: R.formations },
            { label: "Formation continue", href: R.onlineFormations },
            { label: "Admissions", href: R.admissions },
            { label: "Financement", href: R.financement },
          ],
        },
        {
          title: "Réussir",
          links: [
            { label: "Accompagnement personnalisé", href: R.apprenants },
            { label: "Vie étudiante", href: R.vieEtudiante },
            { label: "Entreprises partenaires", href: R.apprenants },
            { label: "Débouchés", href: R.apprenants },
            { label: "Certifications", href: R.certifications },
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
      headerHref: R.business,
      columns: [
        {
          title: "Solutions",
          links: [
            { label: "Former vos équipes", href: R.businessFormations },
            { label: "Créer une académie interne", href: R.businessAcademie },
            { label: "Cartographier les compétences", href: R.businessCompetences },
            { label: "Recruter des talents", href: R.businessRecrutement },
            { label: "Piloter la performance", href: R.businessSolutions },
          ],
        },
        {
          title: "Formations",
          links: [
            { label: "Management", href: R.businessFormations },
            { label: "Vente", href: R.businessFormations },
            { label: "Communication", href: R.businessFormations },
            { label: "IA & productivité", href: R.businessFormations },
            { label: "RH", href: R.businessFormations },
          ],
        },
        {
          title: "Plateforme",
          links: [
            { label: "Parcours blended", href: R.online },
            { label: "E-learning", href: R.onlineFormations },
            { label: "Tableaux de bord", href: R.businessCompetences },
            { label: "Certifications", href: R.certifications },
            { label: "Open Badges", href: R.certifications },
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
    routes: R,
  };
}

export type EdgePremiumConfig = ReturnType<typeof getEdgePremiumConfig>;

const DEFAULT_CONFIG = getEdgePremiumConfig(null);

export const EDGE_PREMIUM_LINKS = DEFAULT_CONFIG.links;

export const EDGE_PREMIUM_NAV = DEFAULT_CONFIG.nav;

export const EDGE_MEGA_APPRENANTS = DEFAULT_CONFIG.megaApprenants;

export const EDGE_MEGA_BUSINESS = DEFAULT_CONFIG.megaBusiness;

export type EdgeMegaColumnsData =
  | EdgePremiumConfig["megaApprenants"]
  | EdgePremiumConfig["megaBusiness"];

export type { EdgeMarketingRoutes };
