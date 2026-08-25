/** Aménagements inclusion / accessibilité RH ↔ collaborateur. */

export type InclusionEvidenceKind = "declared" | "proven" | "signal";

export type InclusionFactor = {
  id: string;
  label: string;
  kind: InclusionEvidenceKind;
  detail?: string;
};

export type InclusionAccommodation = {
  id: string;
  title: string;
  description: string;
  category: "travail" | "temps" | "outils" | "environnement" | "formation" | "suivi";
};

export type EmployeeInclusionProfile = {
  status: "none" | "declared" | "proven" | "mixed";
  summary: string | null;
  factors: InclusionFactor[];
  accommodations: InclusionAccommodation[];
  notes?: string | null;
};

const ACCOMMODATION_LIBRARY: Record<string, InclusionAccommodation> = {
  tiers_temps: {
    id: "tiers_temps",
    title: "Tiers-temps / charge adaptée",
    description: "Allongement des délais sur livrables, évaluations ou montées en compétences.",
    category: "temps",
  },
  consignes_ecrites: {
    id: "consignes_ecrites",
    title: "Consignes écrites structurées",
    description: "Briefs courts, check-lists et reformulation écrite après les réunions.",
    category: "travail",
  },
  supports_visuels: {
    id: "supports_visuels",
    title: "Supports visuels",
    description: "Schémas, slides aérées, polices lisibles, contrastes élevés.",
    category: "outils",
  },
  police_adaptee: {
    id: "police_adaptee",
    title: "Police et lecture adaptées",
    description: "Documents en police dys-friendly, interligne large, mode lecture EDGE.",
    category: "outils",
  },
  teletravail_partiel: {
    id: "teletravail_partiel",
    title: "Télétravail partiel",
    description: "Jours de remote pour réduire la fatigue sensorielle ou les trajets.",
    category: "environnement",
  },
  espace_calme: {
    id: "espace_calme",
    title: "Espace de travail calme",
    description: "Bureau isolé ou casque anti-bruit, créneaux sans open-space bruyant.",
    category: "environnement",
  },
  reunions_courtes: {
    id: "reunions_courtes",
    title: "Réunions courtes & agenda",
    description: "Ordre du jour à l’avance, pauses, possibilité d’async (notes / replay).",
    category: "travail",
  },
  captation: {
    id: "captation",
    title: "Captation / sous-titres",
    description: "Réunions enregistrées, sous-titrage, transcription des points clés.",
    category: "outils",
  },
  mentorat: {
    id: "mentorat",
    title: "Référent / mentor inclusion",
    description: "Point de contact RH ou manager pour ajuster les aménagements.",
    category: "suivi",
  },
  formation_adaptee: {
    id: "formation_adaptee",
    title: "Formation accessible",
    description: "Parcours e-learning adaptable, sessions en petit groupe, supports multi-formats.",
    category: "formation",
  },
  rythme_flex: {
    id: "rythme_flex",
    title: "Horaires flexibles",
    description: "Plages de concentration protégées, démarrage aménagé selon la fatigue.",
    category: "temps",
  },
  pause_sante: {
    id: "pause_sante",
    title: "Pauses santé / micro-breaks",
    description: "Pauses planifiées, réduction des enchaînements d’écrans prolongés.",
    category: "temps",
  },
};

const FACTOR_TO_ACCOMMODATIONS: Record<string, string[]> = {
  rqth: ["tiers_temps", "teletravail_partiel", "mentorat", "formation_adaptee"],
  dyslexie: ["police_adaptee", "supports_visuels", "consignes_ecrites", "formation_adaptee"],
  dyspraxie: ["consignes_ecrites", "supports_visuels", "rythme_flex"],
  tdah: ["reunions_courtes", "espace_calme", "consignes_ecrites", "rythme_flex"],
  fatigue_visuelle: ["pause_sante", "police_adaptee", "teletravail_partiel"],
  troubles_auditifs: ["captation", "reunions_courtes", "consignes_ecrites"],
  anxiete: ["espace_calme", "mentorat", "rythme_flex", "reunions_courtes"],
  tsa: ["consignes_ecrites", "espace_calme", "reunions_courtes", "mentorat"],
  mobilite: ["teletravail_partiel", "rythme_flex", "mentorat"],
};

export function emptyInclusionProfile(): EmployeeInclusionProfile {
  return {
    status: "none",
    summary: null,
    factors: [],
    accommodations: [],
    notes: null,
  };
}

export function buildInclusionProfile(params: {
  factors: InclusionFactor[];
  notes?: string | null;
  extraAccommodationIds?: string[];
}): EmployeeInclusionProfile {
  const factors = params.factors;
  if (factors.length === 0) return emptyInclusionProfile();

  const ids = new Set<string>(params.extraAccommodationIds ?? []);
  for (const factor of factors) {
    for (const accId of FACTOR_TO_ACCOMMODATIONS[factor.id] ?? []) {
      ids.add(accId);
    }
  }

  const accommodations = [...ids]
    .map((id) => ACCOMMODATION_LIBRARY[id])
    .filter((item): item is InclusionAccommodation => Boolean(item));

  const hasProven = factors.some((f) => f.kind === "proven");
  const hasDeclared = factors.some((f) => f.kind === "declared");
  const status: EmployeeInclusionProfile["status"] =
    hasProven && hasDeclared ? "mixed" : hasProven ? "proven" : hasDeclared ? "declared" : "declared";

  const labels = factors.map((f) => f.label).join(", ");
  return {
    status,
    summary: labels,
    factors,
    accommodations,
    notes: params.notes ?? null,
  };
}

export function evidenceKindLabel(kind: InclusionEvidenceKind) {
  if (kind === "proven") return "Prouvé / documenté";
  if (kind === "declared") return "Déclaré";
  return "Signal détecté";
}

export function accommodationCategoryLabel(category: InclusionAccommodation["category"]) {
  if (category === "travail") return "Organisation du travail";
  if (category === "temps") return "Temps & rythme";
  if (category === "outils") return "Outils & supports";
  if (category === "environnement") return "Environnement";
  if (category === "formation") return "Formation";
  return "Suivi RH";
}

/** Profils démo EDGEBS pour fiches collaborateurs. */
export function getEdgebsDemoInclusion(employeeId: string): EmployeeInclusionProfile {
  const key = String(employeeId);
  if (key.includes("alex")) {
    return buildInclusionProfile({
      factors: [
        {
          id: "rqth",
          label: "RQTH",
          kind: "proven",
          detail: "Reconnaissance administrative en cours de validité",
        },
        {
          id: "dyslexie",
          label: "Dyslexie",
          kind: "declared",
          detail: "Déclaré lors de l’onboarding + signaux lecture",
        },
      ],
      notes: "Priorité : supports écrits structurés et charge adaptée en période de closing.",
    });
  }
  if (key.includes("julie")) {
    return buildInclusionProfile({
      factors: [
        {
          id: "tdah",
          label: "TDAH",
          kind: "declared",
          detail: "Déclaration volontaire collaboratrice",
        },
      ],
      notes: "Préférer les briefs courts et les créneaux de concentration protégés.",
    });
  }
  if (key.includes("sarah")) {
    return buildInclusionProfile({
      factors: [
        {
          id: "fatigue_visuelle",
          label: "Fatigue visuelle / migraines",
          kind: "declared",
          detail: "Déclaré au manager et à la RH",
        },
      ],
    });
  }
  if (key.includes("clara")) {
    return buildInclusionProfile({
      factors: [
        {
          id: "troubles_auditifs",
          label: "Trouble auditif léger",
          kind: "proven",
          detail: "Attestation médicale transmise au service RH",
        },
      ],
    });
  }
  if (key.includes("thomas")) {
    return buildInclusionProfile({
      factors: [
        {
          id: "anxiete",
          label: "Anxiété situationnelle",
          kind: "signal",
          detail: "Signal issu du suivi bien-être (non diagnostic médical)",
        },
      ],
      notes: "Aménagements préventifs — à valider avec le collaborateur.",
    });
  }
  // Autres démo : ~1/4 avec un facteur léger
  const n = Number(key.replace(/\D/g, "")) || 0;
  if (n % 4 === 0) {
    return buildInclusionProfile({
      factors: [
        {
          id: "mobilite",
          label: "Contrainte de mobilité",
          kind: "declared",
          detail: "Déclaré au service RH",
        },
      ],
    });
  }
  return emptyInclusionProfile();
}
