import type { Parcours } from "@/lib/parcours";
import { EDGE_ONLINE_THEMATIQUES, getParcours } from "@/lib/parcours";

export type ObjectifId = "vente" | "management" | "produit" | "rh" | "formation" | "cognition";
export type ProfilId = "reconversion" | "progression" | "equipes";
export type FormatId = "bootcamp" | "rythme" | "entreprise";

export type OrientationResult = {
  objectifs: ObjectifId[];
  profil: ProfilId;
  format: FormatId;
  parcours: Parcours[];
};

export const ORIENTATION_OBJECTIFS: { id: ObjectifId; label: string; description: string }[] = [
  { id: "vente", label: "Vendre & négocier", description: "Performance commerciale, prospection, closing" },
  { id: "management", label: "Manager & diriger", description: "Leadership, transformation, pilotage d'équipe" },
  { id: "produit", label: "Innover & produire", description: "Produit, MVP, intrapreneuriat" },
  { id: "rh", label: "RH & talents", description: "Développement humain, coaching, HRBP" },
  { id: "formation", label: "Former & transmettre", description: "Ingénierie pédagogique, facilitation" },
  { id: "cognition", label: "Mieux penser", description: "Cognition, décision, méthodes" },
];

export const ORIENTATION_PROFILS: { id: ProfilId; label: string; description: string }[] = [
  { id: "reconversion", label: "Je me reconvertis", description: "Changer de métier ou de trajectoire" },
  { id: "progression", label: "Je monte en compétences", description: "Consolider ou évoluer dans mon poste actuel" },
  { id: "equipes", label: "Je forme des équipes", description: "Déployer la montée en compétences à l'échelle" },
];

export const ORIENTATION_FORMATS: { id: FormatId; label: string; description: string }[] = [
  { id: "bootcamp", label: "Parcours certifiant intensif", description: "Bootcamp, livrables, Open Badge IMS Global" },
  { id: "rythme", label: "À mon rythme", description: "EDGE Online — micro-formations par thématique" },
  { id: "entreprise", label: "Pour mon entreprise", description: "Diagnostic, intra, catalogue multi-accès" },
];

const BOOTCAMP_SLUGS: Record<ObjectifId, [string, string, string]> = {
  vente: ["commercial-ia", "sales-operations-manager", "negociateur-sport"],
  management: ["manager-ia", "leader-transformation", "entrepreneur-dirigeant"],
  produit: ["product-builder", "intrapreneur-innovation", "commercial-ia"],
  rh: ["hr-business-partner", "developpeur-talents", "manager-ia"],
  formation: ["formateur-bct", "coach-facilitateur", "developpeur-talents"],
  cognition: ["product-builder", "formateur-bct", "manager-ia"],
};

/** Thématique EDGE Online à mettre en avant selon le 1er objectif choisi. */
export const OBJECTIF_THEME_LABEL: Record<ObjectifId, string> = {
  vente: "Négociation",
  management: "Leadership",
  produit: "IA & Automatisation",
  rh: "Soft Skills",
  formation: "Cognition",
  cognition: "Cognition",
};

export function getBootcampParcours(primaryObjectif: ObjectifId): Parcours[] {
  const slugs = BOOTCAMP_SLUGS[primaryObjectif];
  return slugs.map((slug) => getParcours(slug)).filter((p): p is Parcours => Boolean(p));
}

export function buildOrientationResult(
  objectifs: ObjectifId[],
  profil: ProfilId,
  format: FormatId,
): OrientationResult {
  const primary = objectifs[0] ?? "management";
  return {
    objectifs,
    profil,
    format,
    parcours: format === "bootcamp" ? getBootcampParcours(primary) : [],
  };
}

export function onlineThemesForOrientation(primaryObjectif: ObjectifId) {
  const highlight = OBJECTIF_THEME_LABEL[primaryObjectif];
  return EDGE_ONLINE_THEMATIQUES.map((t) => ({
    ...t,
    highlighted: t.label === highlight,
  }));
}
