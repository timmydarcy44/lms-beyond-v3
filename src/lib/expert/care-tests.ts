export const BYOUND_CARE_TESTS = [
  {
    slug: "mai",
    title: "Test MAI",
    description: "Metacognitive Awareness Inventory — forces et stratégies d'apprentissage.",
    jessicaSlug: "metacognition",
    minutes: 15,
  },
  {
    slug: "soft-skills",
    title: "Test des soft skills",
    description: "Communication, écoute, empathie, responsabilité.",
    jessicaSlug: null,
    minutes: 10,
  },
  {
    slug: "stress-academique",
    title: "Test de stress académique",
    description: "Stress perçu dans les apprentissages et l'orientation.",
    jessicaSlug: "stress-academique",
    minutes: 10,
  },
] as const;

export type ByoundCareTestSlug = (typeof BYOUND_CARE_TESTS)[number]["slug"];

export function getCareTest(slug: string) {
  return BYOUND_CARE_TESTS.find((item) => item.slug === slug) ?? null;
}

export const CARE_INVOICE_EXTRAS = [
  { slug: "mai", label: "Test MAI", cents: 5000 },
  { slug: "soft-skills", label: "Test Soft skills", cents: 19000 },
  { slug: "stress-academique", label: "Test de stress académique", cents: 5000 },
] as const;
