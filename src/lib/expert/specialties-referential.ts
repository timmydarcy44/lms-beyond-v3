/**
 * Référentiel national EDGE — domaines & spécialités.
 * Structure extensible : ajouter un domaine ou des spécialités sans toucher l'UI.
 */

export type ExpertDomain = {
  id: string;
  label: string;
  specialties: string[];
};

export const EXPERT_INTERVENTION_FORMATS = [
  "Présentiel",
  "Distanciel",
  "Hybride",
  "Coaching",
  "Mentorat",
  "Audit",
  "Conseil",
  "Animation",
  "Jury",
] as const;

export const EXPERT_AUDIENCES = [
  "Étudiants",
  "Apprentis",
  "Salariés",
  "Managers",
  "Dirigeants",
  "RH",
  "Collectivités",
  "Secteur public",
  "Associations",
] as const;

export const EXPERT_EXPERIENCE_OPTIONS = [
  "Moins de 3 ans",
  "3 à 5 ans",
  "5 à 10 ans",
  "10 à 15 ans",
  "15 ans et plus",
] as const;

export const EXPERT_GEOGRAPHIC_ZONES = [
  "Île-de-France",
  "Normandie",
  "Hauts-de-France",
  "Grand Est",
  "Bretagne",
  "Pays de la Loire",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Auvergne-Rhône-Alpes",
  "Provence-Alpes-Côte d'Azur",
  "France entière",
  "Europe",
  "International (distanciel)",
] as const;

export const EXPERT_LANGUAGE_OPTIONS = [
  "Français",
  "Anglais",
  "Espagnol",
  "Allemand",
  "Italien",
  "Arabe",
  "Portugais",
] as const;

export const EXPERT_AVAILABILITY_OPTIONS = [
  "Temps plein",
  "Mi-temps",
  "Quelques jours / mois",
  "Missions ponctuelles",
  "Distanciel uniquement",
  "Sur demande",
] as const;

const mgmt = [
  "Management d'équipe",
  "Leadership",
  "Management transversal",
  "Management de proximité",
  "Conduite du changement",
  "Gestion des conflits",
  "Motivation",
  "Communication managériale",
  "Pilotage de la performance",
];

export const EXPERT_DOMAINS: ExpertDomain[] = [
  { id: "management", label: "Management", specialties: mgmt },
  {
    id: "commerce-vente",
    label: "Commerce & Vente",
    specialties: [
      "Techniques de vente",
      "Négociation commerciale",
      "Account management",
      "Vente consultative",
      "Prospection B2B",
      "Fidélisation client",
      "Commerce international",
      "Retail & distribution",
    ],
  },
  {
    id: "communication",
    label: "Communication",
    specialties: [
      "Communication interne",
      "Communication externe",
      "Prise de parole en public",
      "Storytelling",
      "Relations presse",
      "Personal branding",
      "Communication digitale",
      "Crise & réputation",
    ],
  },
  {
    id: "rh",
    label: "Ressources Humaines",
    specialties: [
      "Recrutement",
      "GPEC & mobilité",
      "Marque employeur",
      "Relations sociales",
      "Formation RH",
      "Rémunération & avantages",
      "Diversité & inclusion",
      "QAIE / QVCT",
    ],
  },
  {
    id: "ia",
    label: "Intelligence Artificielle",
    specialties: [
      "IA générative",
      "Prompt Engineering",
      "Copilot",
      "ChatGPT",
      "Automatisation",
      "Data & analytics",
      "IA responsable",
      "Transformation IA",
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    specialties: [
      "Marketing digital",
      "Content marketing",
      "SEO / SEA",
      "Social media",
      "Marketing produit",
      "Growth marketing",
      "Brand strategy",
      "Marketing automation",
    ],
  },
  {
    id: "numerique",
    label: "Numérique",
    specialties: [
      "Transformation digitale",
      "Culture numérique",
      "Outils collaboratifs",
      "Productivité digitale",
      "No-code / low-code",
      "Design UX",
      "E-commerce",
      "Dématérialisation",
    ],
  },
  {
    id: "gestion-projet",
    label: "Gestion de projet",
    specialties: [
      "Méthodes agiles",
      "Scrum & Kanban",
      "Gestion de portefeuille",
      "Planification & suivi",
      "Gestion des risques",
      "Chef de projet",
      "PMO",
      "Gestion multi-projets",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    specialties: [
      "Analyse financière",
      "Contrôle de gestion",
      "Trésorerie",
      "Finance d'entreprise",
      "Budget & reporting",
      "Investissement",
      "Finance pour non-financiers",
      "Audit financier",
    ],
  },
  {
    id: "comptabilite",
    label: "Comptabilité",
    specialties: [
      "Comptabilité générale",
      "Comptabilité analytique",
      "Fiscalité",
      "Clôture comptable",
      "Normes comptables",
      "Paie & social",
      "Outils comptables",
      "Contrôle interne",
    ],
  },
  {
    id: "sante",
    label: "Santé",
    specialties: [
      "Santé au travail",
      "Prévention des risques",
      "Management santé",
      "Qualité en santé",
      "Formation soignants",
      "Bien-être professionnel",
      "Sécurité patients",
      "Réglementation santé",
    ],
  },
  {
    id: "neurosciences",
    label: "Neurosciences",
    specialties: [
      "Neurosciences cognitives",
      "Neurosciences appliquées au management",
      "Gestion du stress",
      "Performance cognitive",
      "Neuroleadership",
      "Bien-être mental",
      "Prise de décision",
      "Habitudes & comportements",
    ],
  },
  {
    id: "formation",
    label: "Formation",
    specialties: [
      "Ingénierie pédagogique",
      "Animation de formation",
      "Formation à distance",
      "Blended learning",
      "Évaluation des acquis",
      "Digital learning",
      "Formation professionnelle",
      "Conception de parcours",
    ],
  },
  {
    id: "dev-personnel",
    label: "Développement personnel",
    specialties: [
      "Confiance en soi",
      "Gestion du stress",
      "Intelligence émotionnelle",
      "Prise de décision",
      "Créativité",
      "Mindset & résilience",
      "Coaching de vie pro",
      "Affirmation de soi",
    ],
  },
  {
    id: "soft-skills",
    label: "Soft Skills",
    specialties: [
      "Communication interpersonnelle",
      "Travail en équipe",
      "Adaptabilité",
      "Esprit critique",
      "Résolution de problèmes",
      "Empathie",
      "Gestion du temps",
      "Collaboration",
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    specialties: [
      "Leadership situationnel",
      "Leadership inspirant",
      "Leadership collectif",
      "Charisme & influence",
      "Vision stratégique",
      "Développement de leaders",
      "Leadership inclusif",
      "Posture de dirigeant",
    ],
  },
  {
    id: "organisation",
    label: "Organisation",
    specialties: [
      "Organisation du travail",
      "Process & méthodes",
      "Lean management",
      "Amélioration continue",
      "Organisation de services",
      "Productivité",
      "Outils d'organisation",
      "Restructuration",
    ],
  },
  {
    id: "qualite",
    label: "Qualité",
    specialties: [
      "Management de la qualité",
      "Normes ISO",
      "Audit qualité",
      "Amélioration continue",
      "Qualité de service",
      "Certification",
      "Contrôle qualité",
      "Démarche qualité",
    ],
  },
  {
    id: "innovation",
    label: "Innovation",
    specialties: [
      "Innovation managériale",
      "Design thinking",
      "Intrapreneuriat",
      "Créativité en entreprise",
      "Innovation produit",
      "Veille & tendances",
      "Prototypage rapide",
      "Culture de l'innovation",
    ],
  },
  {
    id: "achats",
    label: "Achats",
    specialties: [
      "Négociation achats",
      "Sourcing",
      "Achats responsables",
      "Category management",
      "Achats internationaux",
      "Gestion fournisseurs",
      "Achats publics",
      "Supply chain achats",
    ],
  },
  {
    id: "supply-chain",
    label: "Supply Chain",
    specialties: [
      "Logistique",
      "Gestion des stocks",
      "Planification supply",
      "Transport & distribution",
      "Supply chain digitale",
      "Achats-logistique",
      "Lean supply chain",
      "Gestion de la demande",
    ],
  },
  {
    id: "cybersecurite",
    label: "Cybersécurité",
    specialties: [
      "Sensibilisation cyber",
      "Sécurité des SI",
      "RGPD & conformité",
      "Gestion des incidents",
      "Cybersécurité managériale",
      "Risques cyber",
      "Sécurité cloud",
      "Culture sécurité",
    ],
  },
  {
    id: "secteur-public",
    label: "Secteur public",
    specialties: [
      "Management public",
      "Politiques publiques",
      "Conduite du changement public",
      "Achats publics",
      "Transformation publique",
      "Relations usagers",
      "Gouvernance territoriale",
      "Formation agents publics",
    ],
  },
];

export function getDomainById(id: string | null | undefined): ExpertDomain | undefined {
  if (!id) return undefined;
  return EXPERT_DOMAINS.find((d) => d.id === id);
}

export function getDomainsByIds(ids: string[]): ExpertDomain[] {
  return ids.map((id) => getDomainById(id)).filter((d): d is ExpertDomain => Boolean(d));
}

export const SPECIALTY_KEY_SEP = "::";

export function makeSpecialtyKey(domainId: string, label: string): string {
  return `${domainId}${SPECIALTY_KEY_SEP}${label}`;
}

export function parseSpecialtyKey(key: string): { domainId: string; label: string } | null {
  const idx = key.indexOf(SPECIALTY_KEY_SEP);
  if (idx === -1) return null;
  return { domainId: key.slice(0, idx), label: key.slice(idx + SPECIALTY_KEY_SEP.length) };
}

export function getSpecialtyLabel(key: string): string {
  return parseSpecialtyKey(key)?.label ?? key;
}

/** Spécialités agrégées pour tous les domaines sélectionnés, groupées par domaine. */
export function getAggregatedSpecialtyGroups(domainIds: string[]): { domain: ExpertDomain; key: string; label: string }[] {
  const groups: { domain: ExpertDomain; key: string; label: string }[] = [];
  for (const domain of getDomainsByIds(domainIds)) {
    for (const label of domain.specialties) {
      groups.push({ domain, key: makeSpecialtyKey(domain.id, label), label });
    }
  }
  return groups;
}

export type ExpertSpecialtiesProfile = {
  /** Ordre de sélection : le 1er = domaine principal. */
  domainIds: string[];
  specialtyKeys: string[];
  formats: string[];
  audiences: string[];
  yearsExperience: string;
  geographicZones: string[];
  languages: string[];
  availabilities: string[];
};

export const EMPTY_SPECIALTIES_PROFILE: ExpertSpecialtiesProfile = {
  domainIds: [],
  specialtyKeys: [],
  formats: [],
  audiences: [],
  yearsExperience: "",
  geographicZones: [],
  languages: [],
  availabilities: [],
};

export function getPrimaryDomain(profile: ExpertSpecialtiesProfile): ExpertDomain | undefined {
  return getDomainById(profile.domainIds[0]);
}

export function getSecondaryDomains(profile: ExpertSpecialtiesProfile): ExpertDomain[] {
  return getDomainsByIds(profile.domainIds.slice(1));
}

/** Valide l'étape Spécialités avant passage à Validation. */
export function isSpecialtiesStepComplete(p: ExpertSpecialtiesProfile): boolean {
  return Boolean(
    p.domainIds.length > 0 &&
      p.specialtyKeys.length > 0 &&
      p.formats.length > 0 &&
      p.audiences.length > 0,
  );
}

export type ExpertRegistrationPayload = {
  primary_domain: string | null;
  secondary_domains: string[];
  domains: string[];
  specialties: string[];
  formats_supported: string[];
  audiences: string[];
  years_experience: string | null;
  geographic_zones: string[];
  languages: string[];
  availabilities: string[];
};

/** Format envoyé à l'API — référentiel structuré pour matching EDGE. */
export function buildSpecialtiesPayload(p: ExpertSpecialtiesProfile): ExpertRegistrationPayload {
  const domains = getDomainsByIds(p.domainIds);
  const primary = domains[0]?.label ?? null;
  const secondary = domains.slice(1).map((d) => d.label);

  const specialties = p.specialtyKeys
    .map((key) => {
      const parsed = parseSpecialtyKey(key);
      if (!parsed) return null;
      const domain = getDomainById(parsed.domainId);
      return domain ? `${domain.label} › ${parsed.label}` : parsed.label;
    })
    .filter((s): s is string => Boolean(s));

  return {
    primary_domain: primary,
    secondary_domains: secondary,
    domains: domains.map((d) => d.label),
    specialties,
    formats_supported: p.formats,
    audiences: p.audiences,
    years_experience: p.yearsExperience || null,
    geographic_zones: p.geographicZones,
    languages: p.languages,
    availabilities: p.availabilities,
  };
}

/** Bascule un domaine (ordre = ordre de sélection, 1er = principal). */
export function toggleDomainId(current: string[], domainId: string): string[] {
  if (current.includes(domainId)) {
    return current.filter((id) => id !== domainId);
  }
  return [...current, domainId];
}

/** Retire les spécialités liées aux domaines désélectionnés. */
export function pruneSpecialtyKeys(keys: string[], activeDomainIds: string[]): string[] {
  const active = new Set(activeDomainIds);
  return keys.filter((key) => {
    const parsed = parseSpecialtyKey(key);
    return parsed ? active.has(parsed.domainId) : false;
  });
}
