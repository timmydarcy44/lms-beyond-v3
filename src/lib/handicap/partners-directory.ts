/** AN-HAN-01 — Annuaire des partenaires handicap (Byound). */

export type HandicapPartner = {
  id: string;
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  /** Date ISO du premier contact établi (colonne annuaire). */
  contactEstablishedOn?: string | null;
  notes?: string | null;
};

export const HANDICAP_PARTNERS_META = {
  reference: "AN-HAN-01",
  title: "Annuaire des partenaires handicap",
  version: "1.0",
  /** Dernière mise à jour du document (version 1.0). */
  lastUpdatedOn: "2026-11-13",
  lastUpdatedLabel: "13/11/2026",
  nextReviewLabel: "Novembre 2027 (revue annuelle)",
  author: "Jessica CONTENTIN, présidente et référente handicap",
  referentName: "Jessica CONTENTIN",
  referentEmail: "jessica.contentin@byound.fr",
  qualiopiIndicators: "Ind. 26 · Document associé à la procédure PR-HAN-01",
  usageRule:
    "La référente sollicite d’abord la Ressource Handicap Formation Normandie, puis le partenaire le plus adapté à la situation. Chaque contact est noté dans la dernière colonne et, pour un bénéficiaire, dans sa fiche de suivi FS-HAN-01.",
  coordsNote:
    "Coordonnées relevées le 13/11/2026 à partir des sources publiques des organismes. Elles sont à vérifier lors du premier contact puis une fois par an, à l’occasion de la revue de la procédure.",
  pdfPath: "/qualiopi/handicap/AN-HAN-01_Annuaire_partenaires_handicap.pdf",
} as const;

export const HANDICAP_PARTNERS: HandicapPartner[] = [
  {
    id: "rhf-normandie",
    name: "Ressource Handicap Formation (RHF) Normandie",
    role:
      "Premier recours. Appui gratuit de l’Agefiph aux organismes de formation : analyse d’une situation, construction des aménagements, mise en relation. Anime le réseau régional des référents handicap.",
    phone: "02 31 93 64 86",
    email: "accueil.rhf@rhf-normandie.fr",
    website: "https://www.agefiph.fr/services/ressource-handicap-formation",
  },
  {
    id: "agefiph-normandie",
    name: "Agefiph · Délégation régionale Normandie",
    role:
      "Aides financières et services pour compenser le handicap en formation et en emploi (secteur privé) : matériel, aide humaine, appuis spécifiques par type de handicap.",
    phone: "0 800 11 10 09 (gratuit)",
    address: "Immeuble Les Galées du Roi, 30 rue Henri Gadeau de Kerville, 76107 Rouen cedex 1",
    website: "https://www.agefiph.fr",
  },
  {
    id: "cap-emploi-14",
    name: "Cap emploi Calvados",
    role:
      "Accompagnement des personnes en situation de handicap et des employeurs : accès à l’emploi, maintien dans l’emploi, projet de formation.",
    phone: "02 31 93 24 24",
    email: "capemploi14@capemploi14.com",
    address: "4-6 rue Ferdinand Buisson, Parc Athéna, 14280 Saint-Contest",
  },
  {
    id: "mdph-14",
    name: "MDPH du Calvados",
    role:
      "Reconnaissance de la qualité de travailleur handicapé (RQTH), droits et compensation. Vers qui orienter une personne qui souhaite faire reconnaître sa situation.",
    phone: "0 800 100 522 (gratuit) · 02 31 78 91 75",
    email: "mdph@calvados.fr",
    address: "17 rue du 11 Novembre, 14000 Caen",
  },
  {
    id: "france-travail",
    name: "France Travail",
    role: "Bénéficiaires demandeurs d’emploi : projet de formation, financement, lien avec le conseiller.",
    phone: "3949",
    website: "https://www.francetravail.fr",
  },
  {
    id: "mission-locale-caen",
    name: "Mission Locale Caen Mer Calvados Centre",
    role: "Bénéficiaires de 16 à 25 ans : accompagnement global vers l’emploi et la formation.",
    phone: "02 31 46 21 46",
    address: "Cidem, 1 place de l’Europe, 14200 Hérouville-Saint-Clair",
  },
  {
    id: "prith-normandie",
    name: "PRITH Normandie",
    role:
      "Plan régional d’insertion des travailleurs handicapés : ressources, actualités et cartographie des acteurs régionaux.",
    website: "https://www.prith-normandie.fr",
  },
  {
    id: "mission-ville-handicap-caen",
    name: "Mission ville-handicap de Caen (CCAS)",
    role: "Information locale sur l’accessibilité et les services du territoire caennais.",
    phone: "02 31 15 38 56",
    email: "missionvillehandicap@caen.fr",
    address: "9 rue de l’Engannerie, 14000 Caen",
  },
  {
    id: "unafam-14",
    name: "Unafam Calvados",
    role: "Soutien et information sur le handicap psychique.",
    phone: "02 31 85 24 87",
    email: "14@unafam.org",
    address: "Maison des associations, 8 rue Germaine Tillion, 14000 Caen",
  },
  {
    id: "valentin-hauy-caen",
    name: "Association Valentin Haüy · Caen",
    role: "Déficience visuelle : conseils et solutions d’accessibilité.",
    address: "5 rue Roger Bastion, 14000 Caen",
  },
  {
    id: "entreprise-cliente",
    name: "Interlocuteurs de l’entreprise cliente",
    role:
      "Médecin du travail (aménagements de poste et préconisations) et référent handicap de l’entreprise (obligatoire à partir de 250 salariés).",
    notes: "Coordonnées à recueillir lors de l’analyse du besoin",
  },
];
