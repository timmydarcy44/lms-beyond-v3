export const BEYOND_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Beyond/beyond-logo-noir.png";

export const BEYOND_AGENCY_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

export const CONTACT_MAIL =
  "mailto:contact@beyondcenter.fr?subject=Optimisation%20performance%20commerciale";

/** Image hero — forme abstraite minimaliste */
export const HERO_IMAGE_URL = "/images/beyond-hero-abstract.png";

export const PRESTATIONS = [
  {
    title: "CRM & pipeline commercial",
    description: "Structurer le suivi des prospects, accélérer les relances et fiabiliser le forecast.",
    icon: "layout",
  },
  {
    title: "Automatisation commerciale",
    description: "Emails, relances, scoring et tâches récurrentes pour gagner du temps terrain.",
    icon: "workflow",
  },
  {
    title: "Intelligence artificielle",
    description: "Priorisation des comptes, synthèses prospect et recommandations d'actions.",
    icon: "sparkles",
  },
  {
    title: "Portails & extranets",
    description: "Espaces clients et collaborateurs pour fluidifier la relation commerciale.",
    icon: "portal",
  },
  {
    title: "Formation & LMS",
    description: "Montée en compétence des équipes commerciales et suivi des parcours.",
    icon: "graduation",
  },
  {
    title: "Développement sur mesure",
    description: "Outils métiers adaptés à vos processus de vente et de delivery.",
    icon: "code",
  },
  {
    title: "API & intégrations",
    description: "Connexion CRM, ERP, facturation et outils existants.",
    icon: "plug",
  },
  {
    title: "UX / UI Design",
    description: "Interfaces claires pour des équipes qui vendent plus vite.",
    icon: "pen",
  },
] as const;

export const CASE_STUDIES = [
  {
    name: "EDGE",
    problem: "Optimisation de la performance commerciale et des parcours formation B2B.",
    tech: "CRM · Pipeline · IA · LMS",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop",
    href: "https://edgebs.fr",
  },
  {
    name: "NEVO",
    problem: "Parcours d'apprentissage neuroadaptatif pour accélérer l'adoption.",
    tech: "React · OpenAI · PWA",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80&auto=format&fit=crop",
    href: "#",
  },
  {
    name: "CRM Entreprise",
    problem: "Pilotage commercial et suivi des opportunités sur mesure.",
    tech: "TypeScript · PostgreSQL · Resend",
    image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&auto=format&fit=crop",
    href: "#",
  },
  {
    name: "LMS White Label",
    problem: "Plateforme de formation pour déployer l'expertise à grande échelle.",
    tech: "Next.js · Stripe · Multi-tenant",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&auto=format&fit=crop",
    href: "#",
  },
] as const;
