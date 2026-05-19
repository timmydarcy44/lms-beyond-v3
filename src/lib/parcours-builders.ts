import type {
  Parcours,
  ParcoursAddon,
  ParcoursAvantApres,
  ParcoursExpert,
  ParcoursFaqItem,
  ParcoursModule,
  ParcoursProfil,
} from "@/lib/parcours";
import { FAMILLE_LABELS, type ParcoursFamille, type ParcoursNiveau } from "@/lib/parcours-constants";

type ModuleInput = { code: string; titre: string; description?: string };
type AddonInput = { titre: string; prix: number; thematique?: string; benefit?: string };

export type ParcoursNarrativeInput = {
  slug: string;
  titre: string;
  titreMarketing?: string;
  famille: ParcoursFamille;
  cible: string;
  promesse: string;
  description?: string;
  prix: number;
  duree: string;
  niveau: ParcoursNiveau;
  equivalenceAcademique: string;
  prerequis: string[];
  modules: ModuleInput[];
  addons: AddonInput[];
  livrables: string[];
  badge: string;
  profils: ParcoursProfil[];
  avantApres: ParcoursAvantApres;
  faq: ParcoursFaqItem[];
  expert?: ParcoursExpert;
  speedMeeting?: boolean;
  imageUrl?: string;
};

const DEFAULT_MODULE_DESC = "Module certifiant — mise en pratique et livrables terrain.";

export function buildModules(modules: ModuleInput[]): ParcoursModule[] {
  return modules.map((m) => ({
    code: m.code,
    titre: m.titre,
    description: m.description ?? DEFAULT_MODULE_DESC,
  }));
}

export function buildAddons(slug: string, addons: AddonInput[]): ParcoursAddon[] {
  return addons.map((a, i) => ({
    id: `${slug}-addon-${i + 1}`,
    titre: a.titre,
    thematique: a.thematique ?? "Approfondissement",
    prix: a.prix,
    benefit: a.benefit,
  }));
}

export function normalizeExpertImage(image: string): string {
  return image.replace(/^\/public/, "");
}

export function buildParcours(input: ParcoursNarrativeInput): Parcours {
  return {
    slug: input.slug,
    titre: input.titre,
    titreMarketing: input.titreMarketing ?? input.titre,
    famille: input.famille,
    familleLabel: FAMILLE_LABELS[input.famille],
    cible: input.cible,
    duree: input.duree,
    prix: input.prix,
    description: input.description ?? input.promesse,
    promesse: input.promesse,
    niveau: input.niveau,
    equivalenceAcademique: input.equivalenceAcademique,
    prerequis: input.prerequis,
    modules: buildModules(input.modules),
    addons: buildAddons(input.slug, input.addons),
    livrables: input.livrables,
    badge: input.badge,
    profils: input.profils,
    avantApres: input.avantApres,
    faq: input.faq,
    expert: input.expert
      ? { ...input.expert, image: normalizeExpertImage(input.expert.image) }
      : undefined,
    speedMeeting: input.speedMeeting ?? false,
    imageUrl: input.imageUrl,
    narrativeTemplate: true,
  };
}

export function parcoursHeroImage(slug: string): string {
  return `/images/parcours-${slug}.jpg`;
}
