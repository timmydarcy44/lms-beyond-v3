/** Fallback déterministe quand OpenAI est indisponible (quota, clé absente, etc.). */

type SoftSkillTarget = { label: string; score: number };

type MetierAiSkills = {
  description: string;
  hard_skills: string[];
  soft_skills: SoftSkillTarget[];
};

const DEFAULT_SOFT: SoftSkillTarget[] = [
  { label: "Communication", score: 80 },
  { label: "Collaboration", score: 75 },
  { label: "Organisation", score: 78 },
  { label: "Adaptabilite", score: 72 },
  { label: "Autonomie", score: 74 },
  { label: "Rigueur", score: 76 },
  { label: "Resolution de problemes", score: 78 },
  { label: "Gestion du stress", score: 70 },
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
        { label: "Assertivite", score: 82 },
        { label: "Ecoute", score: 85 },
        { label: "Resilience", score: 80 },
        { label: "Influence", score: 78 },
        { label: "Organisation", score: 75 },
        { label: "Gestion du stress", score: 72 },
      ],
    };
  }

  if (matches(t, "rh", "talent", "recrut", "people", "ressources humaines")) {
    return {
      description: `Piloter competences, engagement et parcours collaborateurs pour le role ${t}.`,
      hard_skills: ["GPEC", "SIRH", "Recrutement", "Entretiens", "Reporting RH", "Droit social de base"],
      soft_skills: [
        { label: "Empathie", score: 88 },
        { label: "Discernement", score: 82 },
        { label: "Communication", score: 85 },
        { label: "Organisation", score: 80 },
        { label: "Confidentialite", score: 90 },
        { label: "Negociation", score: 72 },
      ],
    };
  }

  if (matches(t, "manager", "responsable", "team lead", "chef d")) {
    return {
      description: `Animer la performance collective et accompagner la montee en competences pour le role ${t}.`,
      hard_skills: ["People management", "KPI", "Delegation", "Conduite du changement", "Feedback", "Planification"],
      soft_skills: [
        { label: "Leadership", score: 88 },
        { label: "Feedback", score: 85 },
        { label: "Cooperation", score: 80 },
        { label: "Gestion du stress", score: 78 },
        { label: "Decision", score: 82 },
        { label: "Communication", score: 84 },
      ],
    };
  }

  if (matches(t, "marketing", "brand", "content", "communication")) {
    return {
      description: `Construire la marque, les contenus et la performance acquisition pour le role ${t}.`,
      hard_skills: ["SEO", "Content marketing", "Analytics", "CRM marketing", "Brand", "Reseaux sociaux"],
      soft_skills: [
        { label: "Creativite", score: 85 },
        { label: "Communication", score: 88 },
        { label: "Collaboration", score: 78 },
        { label: "Organisation", score: 76 },
        { label: "Adaptabilite", score: 80 },
        { label: "Rigueur", score: 74 },
      ],
    };
  }

  if (matches(t, "learning", "formation", "l&d", "formateur", "pedagog")) {
    return {
      description: `Concevoir et animer des parcours de formation alignes business pour le role ${t}.`,
      hard_skills: ["Ingenierie pedagogique", "LMS", "Animation", "Evaluation", "Blended learning", "Reporting L&D"],
      soft_skills: [
        { label: "Pedagogie", score: 90 },
        { label: "Communication", score: 86 },
        { label: "Empathie", score: 82 },
        { label: "Organisation", score: 80 },
        { label: "Creativite", score: 78 },
        { label: "Adaptabilite", score: 84 },
      ],
    };
  }

  if (matches(t, "dev", "ingenieur", "tech", "data", "produit", "product")) {
    return {
      description: `Livrer des solutions fiables, mesurables et alignees produit pour le role ${t}.`,
      hard_skills: ["Analyse", "SQL", "Agile/Scrum", "Documentation", "Tests", "Outils collaboratifs"],
      soft_skills: [
        { label: "Resolution de problemes", score: 88 },
        { label: "Rigueur", score: 85 },
        { label: "Collaboration", score: 78 },
        { label: "Autonomie", score: 82 },
        { label: "Communication", score: 74 },
        { label: "Adaptabilite", score: 80 },
      ],
    };
  }

  return {
    description: `Missions, responsabilites et attentes de performance pour le role ${t}.`,
    hard_skills: ["Outils metier", "Reporting", "Gestion de projet", "Pack Office", "Process internes", "Qualite"],
    soft_skills: DEFAULT_SOFT,
  };
}
