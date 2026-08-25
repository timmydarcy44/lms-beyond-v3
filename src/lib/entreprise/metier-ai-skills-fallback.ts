/** Fallback déterministe quand OpenAI est indisponible (quota, clé absente, etc.). */

type SoftSkillTarget = { label: string; score: number };

type MetierAiSkills = {
  description: string;
  hard_skills: string[];
  soft_skills: SoftSkillTarget[];
};

/** Cibles Soft Skills métier — échelle test EDGE /15. */
const DEFAULT_SOFT: SoftSkillTarget[] = [
  { label: "Communication", score: 12 },
  { label: "Collaboration", score: 11 },
  { label: "Organisation", score: 12 },
  { label: "Adaptabilite", score: 11 },
  { label: "Autonomie", score: 11 },
  { label: "Rigueur", score: 11 },
  { label: "Resolution de problemes", score: 12 },
  { label: "Gestion du stress", score: 10 },
];

function matches(title: string, ...needles: string[]) {
  const hay = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return needles.some((n) => hay.includes(n));
}

export function buildMetierAiSkillsFallback(title: string): MetierAiSkills {
  const t = title.trim() || "ce metier";

  if (matches(t, "commercial", "vente", "sales", "account", "business develop")) {
    return {
      description: `Developper le portefeuille, qualifier les opportunites et conclure des deals pour le role ${t}.`,
      hard_skills: ["CRM", "Prospection", "Negociation", "Pipeline", "Discovery call", "Reporting commercial"],
      soft_skills: [
        { label: "Assertivite", score: 12 },
        { label: "Ecoute", score: 13 },
        { label: "Resilience", score: 12 },
        { label: "Influence", score: 12 },
        { label: "Organisation", score: 11 },
        { label: "Gestion du stress", score: 11 },
      ],
    };
  }

  if (matches(t, "rh", "talent", "recrut", "people", "ressources humaines")) {
    return {
      description: `Piloter competences, engagement et parcours collaborateurs pour le role ${t}.`,
      hard_skills: ["GPEC", "SIRH", "Recrutement", "Entretiens", "Reporting RH", "Droit social de base"],
      soft_skills: [
        { label: "Empathie", score: 13 },
        { label: "Discernement", score: 12 },
        { label: "Communication", score: 13 },
        { label: "Organisation", score: 12 },
        { label: "Confidentialite", score: 14 },
        { label: "Negociation", score: 11 },
      ],
    };
  }

  if (matches(t, "manager", "responsable", "team lead", "chef d")) {
    return {
      description: `Animer la performance collective et accompagner la montee en competences pour le role ${t}.`,
      hard_skills: ["People management", "KPI", "Delegation", "Conduite du changement", "Feedback", "Planification"],
      soft_skills: [
        { label: "Leadership", score: 13 },
        { label: "Feedback", score: 13 },
        { label: "Cooperation", score: 12 },
        { label: "Gestion du stress", score: 12 },
        { label: "Decision", score: 12 },
        { label: "Communication", score: 13 },
      ],
    };
  }

  if (matches(t, "marketing", "brand", "content", "communication")) {
    return {
      description: `Construire la marque, les contenus et la performance acquisition pour le role ${t}.`,
      hard_skills: ["SEO", "Content marketing", "Analytics", "CRM marketing", "Brand", "Reseaux sociaux"],
      soft_skills: [
        { label: "Creativite", score: 13 },
        { label: "Communication", score: 13 },
        { label: "Collaboration", score: 12 },
        { label: "Organisation", score: 11 },
        { label: "Adaptabilite", score: 12 },
        { label: "Rigueur", score: 11 },
      ],
    };
  }

  if (matches(t, "learning", "formation", "l&d", "formateur", "pedagog")) {
    return {
      description: `Concevoir et animer des parcours de formation alignes business pour le role ${t}.`,
      hard_skills: ["Ingenierie pedagogique", "LMS", "Animation", "Evaluation", "Blended learning", "Reporting L&D"],
      soft_skills: [
        { label: "Pedagogie", score: 14 },
        { label: "Communication", score: 13 },
        { label: "Empathie", score: 12 },
        { label: "Organisation", score: 12 },
        { label: "Creativite", score: 12 },
        { label: "Adaptabilite", score: 13 },
      ],
    };
  }

  if (matches(t, "dev", "ingenieur", "tech", "data", "produit", "product")) {
    return {
      description: `Livrer des solutions fiables, mesurables et alignees produit pour le role ${t}.`,
      hard_skills: ["Analyse", "SQL", "Agile/Scrum", "Documentation", "Tests", "Outils collaboratifs"],
      soft_skills: [
        { label: "Resolution de problemes", score: 13 },
        { label: "Rigueur", score: 13 },
        { label: "Collaboration", score: 12 },
        { label: "Autonomie", score: 12 },
        { label: "Communication", score: 11 },
        { label: "Adaptabilite", score: 12 },
      ],
    };
  }

  return {
    description: `Missions, responsabilites et attentes de performance pour le role ${t}.`,
    hard_skills: ["Outils metier", "Reporting", "Gestion de projet", "Pack Office", "Process internes", "Qualite"],
    soft_skills: DEFAULT_SOFT,
  };
}
