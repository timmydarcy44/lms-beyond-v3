import type { Metadata } from "next";
import { EdgeBusinessPlaceholderPage } from "@/components/edge-site/marketing/edge-business-placeholder-page";

export type BusinessPlaceholderDef = {
  title: string;
  description: string;
  label?: string;
};

export const BUSINESS_PLACEHOLDER_PAGES = {
  "former-vos-equipes": {
    title: "Former vos équipes",
    description:
      "Déployez des parcours de formation alignés sur vos enjeux métiers, du diagnostic initial au déploiement terrain.",
    label: "Former",
  },
  catalogue: {
    title: "Catalogue de formations",
    description:
      "Parcourez un catalogue structuré par métiers, niveaux et formats pour accélérer vos décisions formation.",
    label: "Former",
  },
  "parcours-sur-mesure": {
    title: "Parcours sur mesure",
    description:
      "Co-construisez des parcours adaptés à votre contexte, vos équipes et vos objectifs de performance.",
    label: "Former",
  },
  "presentiel-distanciel": {
    title: "Présentiel & distanciel",
    description:
      "Combinez sessions en salle, classes virtuelles et ressources asynchrones dans une expérience fluide.",
    label: "Former",
  },
  competences: {
    title: "Cartographier les compétences",
    description:
      "Visualisez les compétences clés de vos équipes, identifiez les écarts et priorisez vos plans d'action.",
    label: "Développer",
  },
  "plans-progression": {
    title: "Plans de progression",
    description:
      "Structurez des trajectoires individuelles et collectives pour faire monter en compétence durablement.",
    label: "Développer",
  },
  certifications: {
    title: "Certifications",
    description:
      "Valorisez les acquis avec des certifications reconnues et alignées sur vos standards internes.",
    label: "Développer",
  },
  "open-badges": {
    title: "Open Badges",
    description:
      "Attribuez des badges certifiants pour rendre visibles les compétences acquises et partagées.",
    label: "Développer",
  },
  "developpement-talents": {
    title: "Développement des talents",
    description:
      "Identifiez les potentiels, accompagnez les hauts potentiels et sécurisez vos relais internes.",
    label: "Développer",
  },
  "identifier-talents": {
    title: "Identifier les talents",
    description:
      "Repérez les profils à fort potentiel grâce à des signaux objectifs sur les compétences et la performance.",
    label: "Recruter",
  },
  "evaluer-competences": {
    title: "Évaluer les compétences",
    description:
      "Mesurez les compétences attendues vs observées pour objectiver vos décisions RH et managériales.",
    label: "Recruter",
  },
  onboarding: {
    title: "Onboarding",
    description:
      "Intégrez plus vite vos nouvelles recrues avec des parcours d'acculturation et de montée en compétence.",
    label: "Recruter",
  },
  "matching-candidats": {
    title: "Matching candidats",
    description:
      "Croisez les besoins de poste et les profils pour accélérer un recrutement plus pertinent.",
    label: "Recruter",
  },
  "tableaux-de-bord": {
    title: "Tableaux de bord",
    description:
      "Pilotez vos actions formation et compétences avec des vues synthétiques par équipe, site ou métier.",
    label: "Piloter",
  },
  analytics: {
    title: "Analytics",
    description:
      "Analysez la progression, l'engagement et l'impact de vos dispositifs sur la performance.",
    label: "Piloter",
  },
  "suivi-parcours": {
    title: "Suivi des parcours",
    description:
      "Suivez l'avancement individuel et collectif pour intervenir au bon moment, au bon niveau.",
    label: "Piloter",
  },
  "roi-formation": {
    title: "ROI formation",
    description:
      "Reliez les investissements formation aux indicateurs métier pour démontrer la valeur créée.",
    label: "Piloter",
  },
  "aide-decision": {
    title: "Aide à la décision",
    description:
      "Appuyez vos arbitrages RH et formation sur des données fiables, partagées et actionnables.",
    label: "Piloter",
  },
} as const satisfies Record<string, BusinessPlaceholderDef>;

export type BusinessPlaceholderSlug = keyof typeof BUSINESS_PLACEHOLDER_PAGES;

export function businessPlaceholderMetadata(slug: BusinessPlaceholderSlug): Metadata {
  const page = BUSINESS_PLACEHOLDER_PAGES[slug];
  return {
    title: `${page.title} — EDGE Business`,
    description: page.description,
  };
}

export async function BusinessPlaceholderRoute({ slug }: { slug: BusinessPlaceholderSlug }) {
  const page = BUSINESS_PLACEHOLDER_PAGES[slug];
  return (
    <EdgeBusinessPlaceholderPage
      title={page.title}
      description={page.description}
      label={page.label}
    />
  );
}
