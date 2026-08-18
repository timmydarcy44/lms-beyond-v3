import type { ClubPartnerPack } from "@/lib/mocks/club-partners";

export const CLUB_PACKS: Record<
  ClubPartnerPack,
  { prix: number; avantages: string[] }
> = {
  Bronze: {
    prix: 2500,
    avantages: [
      "1 panneau publicitaire",
      "Logo sur site web",
      "2 invitations matchs",
      "Mention RS (2x/mois)",
    ],
  },
  Argent: {
    prix: 5000,
    avantages: [
      "2 panneaux publicitaires",
      "Logo maillot entraînement",
      "4 invitations + 1 loge",
      "Mention RS (4x/mois)",
      "Accès annuaire partenaires",
      "1 article dédié",
    ],
  },
  Or: {
    prix: 10000,
    avantages: [
      "Logo maillot match",
      "Naming événement",
      "Loge VIP saison complète",
      "Mention RS (8x/mois)",
      "Accès Beyond Team + LMS",
      "Rapport ROI mensuel",
      "Placement prioritaire annuaire",
    ],
  },
  Personnalisé: {
    prix: 0,
    avantages: [],
  },
};

export const CLUB_PACK_OPTIONS = Object.keys(CLUB_PACKS) as ClubPartnerPack[];

export const CLUB_STATUTS = ["Prospect", "En négociation", "Signé", "À renouveler"] as const;

export const CLUB_SECTEURS = [
  "Banque",
  "Assurance",
  "Automobile",
  "Énergie",
  "Restauration",
  "Hôtellerie",
  "Immobilier",
  "Santé",
  "Sport",
  "Juridique",
  "RH",
  "Transport",
  "Autre",
] as const;

export function inferPack(valeur: number): ClubPartnerPack {
  if (valeur >= 10000) return "Or";
  if (valeur >= 5000) return "Argent";
  if (valeur >= 2500) return "Bronze";
  return "Personnalisé";
}
