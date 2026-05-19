import { isPlaymakersOrganizationSlug } from "@/lib/galaxy-branding";
import { normalizeThematicKey } from "@/lib/galaxy-thematic-helpers";

/**
 * Thématiques Playmakers (référence métier) : libellés en MAJ. pour le builder et l’apprenant.
 * Les `variants` raccrochent d’anciens intitulés (ex. listes intermédiaires) vers le canon.
 */
export const PLAYMAKERS_THEMATIC_GROUPS: ReadonlyArray<{
  canonical: string;
  readonly variants: readonly string[];
}> = [
  {
    canonical: "L'ÉCOSYSTÈME DU SPORT PROFESSIONNEL",
    variants: [
      "L'écosystème du sport professionnel",
      "Ecosystème du sport professionnel",
      "L'ECOSYSTEME DU SPORT PROFESSIONNEL",
    ],
  },
  {
    canonical: "CONSTRUIRE ET VALORISER UNE OFFRE PARTENARIAT",
    variants: [
      "Construire et valoriser une offre partenariat",
      "SPONSORING, PARTENARIATS & ÉVÉNEMENTIEL SPORTIF",
      "Sponsoring, partenariats & événementiel sportif",
      "Sponsoring sportif",
      "Partenariats sport",
    ],
  },
  {
    canonical: "LA NÉGOCIATION COMMERCIALE DANS LE SPORT",
    variants: [
      "La négociation commerciale dans le sport",
      "VENTE & NÉGOCIATION",
      "Vente & négociation",
      "Négociation, marketing & stratégie sportive",
      "Négociation sport",
      "NÉGOCIATION SPORT",
    ],
  },
  {
    canonical: "LA VENTE EN CONTEXTE ÉVÉNEMENTIEL",
    variants: [
      "La vente en contexte événementiel",
      "Événementiel sportif",
      "MÉDIAS, DIGITAL & COMMUNICATION SPORTIVE",
      "Médias, digital & communication sportive",
      "Communication sportive",
    ],
  },
  {
    canonical: "PILOTAGE ET DÉVELOPPEMENT COMMERCIAL",
    variants: [
      "Pilotage et développement commercial",
      "MANAGEMENT & GOUVERNANCE DES ORGANISATIONS SPORTIVES",
      "Management & gouvernance des organisations sportives",
      "DROIT, FINANCE & ÉCONOMIE DU SPORT",
      "Droit, finance & économie du sport",
      "PERFORMANCE, PRÉPARATION & ACCOMPAGNEMENT DES SPORTIFS",
      "Performance, préparation & accompagnement des sportifs",
      "DÉVELOPPEMENT DURABLE, RSE & RESPONSABILITÉ DANS LE SPORT",
      "Développement durable, RSE & responsabilité dans le sport",
      "Digital sport",
    ],
  },
];

export const PLAYMAKERS_COURSE_CATEGORY_LABELS: readonly string[] =
  PLAYMAKERS_THEMATIC_GROUPS.map((g) => g.canonical);

const PM_PREFIX = "playmakers-cat-";

const PLAYMAKERS_NORM_TO_CANON: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const g of PLAYMAKERS_THEMATIC_GROUPS) {
    m.set(normalizeThematicKey(g.canonical), g.canonical);
    for (const v of g.variants) {
      m.set(normalizeThematicKey(String(v)), g.canonical);
    }
  }
  return m;
})();

export function getPlaymakersThematicBuilderOptions(): Array<{ id: string; name: string }> {
  return PLAYMAKERS_COURSE_CATEGORY_LABELS.map((name, i) => ({
    id: `${PM_PREFIX}${i}`,
    name,
  }));
}

export function tryMatchPlaymakersCategoryName(input: string | null | undefined): string | null {
  if (input == null) return null;
  const n = normalizeThematicKey(String(input));
  if (!n) return null;
  return PLAYMAKERS_NORM_TO_CANON.get(n) ?? null;
}

export function isExactPlaymakersLabel(s: string): boolean {
  return (PLAYMAKERS_COURSE_CATEGORY_LABELS as ReadonlyArray<string>).includes(s);
}

export function shouldUsePlaymakersThematicList(organizationSlug: string | null | undefined): boolean {
  return isPlaymakersOrganizationSlug(organizationSlug);
}
