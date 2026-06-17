import type { ParcoursAddon } from "@/lib/parcours";
import { EDGE_COHORTE_LABEL } from "@/lib/edge-site/constants";

export { EDGE_COHORTE_LABEL };

export type PostulerAddonSelection = {
  id: string;
  titre: string;
  prix: number;
};

export type PostulerFormData = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  situation: string;
  source: string;
  acceptContact: boolean;
  objectif: string;
  financement: "oui" | "non" | "";
  motivation: string;
  selectedAddonIds: string[];
};

export const POSTULER_SITUATIONS = [
  "Je suis en poste — je veux progresser",
  "Je suis en reconversion",
  "Je forme / manage des équipes",
  "Autre",
] as const;

export const POSTULER_SOURCES = [
  "Instagram / Réseaux sociaux",
  "Bouche à oreille",
  "LinkedIn",
  "Google",
  "Un expert EDGE",
  "Autre",
] as const;

export const POSTULER_OBJECTIFS = [
  "Progresser dans mon métier actuel",
  "Changer de métier / reconversion",
  "Former ou développer mes équipes",
  "Créer mon activité",
] as const;

export const emptyPostulerForm = (): PostulerFormData => ({
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  situation: "",
  source: "",
  acceptContact: false,
  objectif: "",
  financement: "",
  motivation: "",
  selectedAddonIds: [],
});

export function getSelectedAddons(addons: ParcoursAddon[], selectedIds: string[]): PostulerAddonSelection[] {
  return addons
    .filter((a) => selectedIds.includes(a.id))
    .map((a) => ({ id: a.id, titre: a.titre, prix: a.prix }));
}

export function computeAddonsTotal(addons: ParcoursAddon[], selectedIds: string[]): number {
  return getSelectedAddons(addons, selectedIds).reduce((sum, a) => sum + a.prix, 0);
}

export function validatePostulerStep1(data: PostulerFormData): string | null {
  if (!data.prenom.trim()) return "Le prénom est requis.";
  if (!data.nom.trim()) return "Le nom est requis.";
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    return "Une adresse email valide est requise.";
  }
  if (!data.telephone.trim()) return "Le téléphone est requis.";
  if (!data.situation) return "La situation actuelle est requise.";
  if (!data.acceptContact) return "Tu dois accepter d'être recontacté par EDGE.";
  return null;
}

export function validatePostulerStep2(data: PostulerFormData): string | null {
  if (!data.objectif) return "L'objectif est requis.";
  if (!data.financement) return "Indique si tu souhaites un accompagnement financement.";
  if (!data.motivation.trim()) return "La motivation est requise.";
  return null;
}

export const POSTULER_CONFIRMATION_STORAGE_KEY = "edge-postuler-confirmation";
