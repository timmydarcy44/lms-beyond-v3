export const SF_PRO =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

export const LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/logo_clement_lepley_blanc_transparent.png";

export const HERO_VIDEO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/video%20clement.mp4";

export const COPPER = "#C4845C";

export const BUDGET_OPTIONS = [
  { id: "500-1000", label: "Entre 500 € et 1 000 €" },
  { id: "1000-5000", label: "Entre 1 000 € et 5 000 €" },
  { id: "5000-10000", label: "Entre 5 000 € et 10 000 €" },
  { id: "10000-30000", label: "Entre 10 000 € et 30 000 €" },
  { id: "30000+", label: "Plus de 30 000 €" },
] as const;

export type BudgetId = (typeof BUDGET_OPTIONS)[number]["id"];

export const MEGA_MENU_INTRO = {
  label: "NOS PRESTATIONS",
  title: "Chaque projet part d'un diagnostic sur place, pas d'un catalogue.",
  description:
    "On regarde votre terrain, on écoute ce que vous voulez en faire, et on vous dit ce qui est possible — avant de parler devis.",
};

export const MEGA_MENU_COLUMNS = [
  {
    label: "EXTERIEURS À VIVRE",
    items: ["Terrasses & dallages", "Allées & accès carrossables", "Plateformes piscine & spa"],
  },
  {
    label: "PRÉPARER & SÉCURISER",
    items: ["Nivellement de terrain", "Drainage & évacuation des eaux", "Fondations pour extension"],
  },
  {
    label: "ACCOMPAGNEMENT",
    items: ["Simulation avant / après", "Diagnostic gratuit sur site", "Suivi de chantier"],
  },
] as const;

export const PRESTATIONS = [
  {
    title: "Terrassement",
    description: "Préparation du terrain, nivellement et fondations pour vos futurs aménagements.",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop",
  },
  {
    title: "Terrassement",
    description: "Terrasses, dallages et espaces de vie extérieurs sur mesure.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop",
  },
  {
    title: "Terrassement",
    description: "Allées, accès carrossables et plateformes piscine & spa.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&auto=format&fit=crop",
  },
] as const;

export const REALISATIONS = [
  {
    title: "Terrasse bois & pierre",
    location: "Le Havre",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80&auto=format&fit=crop",
  },
  {
    title: "Allée carrossable",
    location: "Montivilliers",
    image:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80&auto=format&fit=crop",
  },
  {
    title: "Plateforme piscine",
    location: "Honfleur",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80&auto=format&fit=crop",
  },
  {
    title: "Nivellement & drainage",
    location: "Fécamp",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f84dca860?w=800&q=80&auto=format&fit=crop",
  },
] as const;

export const PROJECT_PROMPT_PLACEHOLDER =
  "Ex. : Je souhaite une terrasse en bois avec un espace repas, une allée carrossable jusqu'au garage et un coin détente près de la piscine…";
