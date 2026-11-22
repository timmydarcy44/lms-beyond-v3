export type CompanyContext = {
  name: string;
  sector: string;
  city: string | null;
};

export type CursusSkill = {
  id: string;
  code: string;
  title: string;
  brief: string;
};

export type ProposedMission = {
  id: string;
  code: string;
  competency: string;
  title: string;
  description: string;
  deliverable: string;
};

/** Usages du secteur, pour coller la mission aux normes du métier de l'entreprise. */
export function sectorPractice(sector: string) {
  const value = sector.toLowerCase();
  if (/sport/.test(value)) return "saison sportive, clubs, licenciés, partenaires et équipementiers";
  if (/formation|enseignement|cfa/.test(value)) return "financeurs OPCO, responsables formation, devis de parcours et exigences Qualiopi";
  if (/logiciel|informatique|numérique|saas|édition/.test(value)) return "cycle de vente logiciel, démonstration, décideur métier et renouvellement";
  if (/alimentaire|négoce|agro/.test(value)) return "référencement, centrales d'achat, saisonnalité et conditions commerciales";
  if (/immobilier/.test(value)) return "mandats, estimation, visites et règles de la transaction";
  if (/santé|sante|médical|medical|pharma/.test(value)) return "parcours patient, conformité et interlocuteurs prescripteurs";
  if (/industrie|bâtiment|batiment|btp/.test(value)) return "chantiers, appels d'offres, délais et normes techniques du métier";
  return `vocabulaire, interlocuteurs et cycle de décision du secteur ${sector}`;
}

export function skillsFromReferential(
  structure: unknown,
  modules: Array<{ id: string; code: string; title: string }>,
): CursusSkill[] {
  const data = structure && typeof structure === "object" ? (structure as Record<string, unknown>) : null;
  const missions = Array.isArray(data?.missions_entreprise) ? data.missions_entreprise : [];
  const fromMissions = missions
    .map((item, index) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
      const title = String(row?.titre ?? "").trim();
      if (!title) return null;
      return {
        id: `ref-mission-${index + 1}`,
        code: `M${index + 1}`,
        title,
        brief: String(row?.description ?? title).trim() || title,
      };
    })
    .filter((item): item is CursusSkill => Boolean(item));
  if (fromMissions.length) return fromMissions;
  return modules.map((item) => ({
    id: item.id,
    code: item.code || "Module",
    title: item.title,
    brief: item.title,
  }));
}

/** Compétences par défaut quand le cursus site n’a ni PDF référentiel ni modules. */
const SPECIALIZATION_SKILLS: Record<string, string[]> = {
  ai_business: ["Utiliser l'IA au quotidien", "Rédiger des prompts", "Automatiser des tâches", "Prospection à froid"],
  sport_business: ["Recherche de sponsors", "Dossier de partenariat", "Activation des partenaires", "Prospection à froid"],
  real_estate: ["Prise de mandat", "Visites et négociation immobilière", "Estimation d'un bien", "Prospection à froid"],
  retail_experience: ["Parcours client en magasin", "Merchandising de rayon", "Accueil et conseil", "Prospection à froid"],
  merchandising: ["Implantation de rayon", "Analyse des ventes", "Planogrammes", "Prospection à froid"],
  luxury_premium: ["Expérience client premium", "Storytelling de marque", "Relation VIP", "Prospection à froid"],
  sport_retail: ["Conseil produit sport", "Animation de rayon", "Fidélisation club", "Prospection à froid"],
  ai_management: ["Pilotage d'équipe avec l'IA", "Tableaux de bord", "Priorisation", "Animation d'équipe"],
  business_performance: ["Suivi d'indicateurs", "Plan d'action commercial", "Reporting", "Animation d'équipe"],
  transition_innovation: ["Diagnostic de process", "Conduite du changement", "Veille innovation", "Restitution"],
  growth_acquisition: ["Acquisition de leads", "Tunnel de conversion", "Campagnes digitales", "Prospection à froid"],
  entrepreneurship: ["Validation d'offre", "Pitch commercial", "Suivi de trésorerie", "Prospection à froid"],
  international_business: ["Prospection export", "Dossier marché", "Négociation interculturelle", "Prospection à froid"],
  strategic_partnerships: ["Cartographie partenaires", "Dossier de partenariat", "Suivi d'alliance", "Prospection à froid"],
};

export function defaultSkillsForSpecialization(code: string | null | undefined): CursusSkill[] {
  const key = String(code ?? "")
    .trim()
    .toLowerCase();
  const labels =
    SPECIALIZATION_SKILLS[key] ??
    ["Prospection à froid", "Découverte des besoins", "Utilisation d'un CRM", "Fixer des objectifs"];
  return labels.map((title, index) => ({
    id: `spec-${key || "default"}-${index + 1}`,
    code: `C${index + 1}`,
    title,
    brief: title,
  }));
}

export function proposeCursusMissions(skills: CursusSkill[], company: CompanyContext | null): ProposedMission[] {
  const sector = company?.sector?.trim() || "";
  const practice = sector ? sectorPractice(sector) : "les usages réels du métier exercé dans l'entreprise";
  const place = company
    ? `${company.name}${company.city ? `, ${company.city}` : ""}${sector ? `, secteur ${sector}` : ""}`
    : "l'entreprise d'accueil";
  return skills.map((skill) => {
    const kind = `${skill.code} ${skill.title} ${skill.brief}`.toLowerCase();
    let title = company ? `${skill.title} pour ${company.name}` : skill.title;
    let deliverable = "Compte rendu de mission";
    if (/prospection|prospect|fichier/.test(kind)) {
      title = company ? `Constituer un fichier de prospects pour ${company.name}` : "Constituer un fichier de prospects";
      deliverable = "Fichier qualifié et critères de ciblage";
    } else if (/négoci|negoci|découverte|decouverte|entretien/.test(kind)) {
      title = company ? `Préparer un entretien de découverte pour ${company.name}` : "Préparer un entretien de découverte";
      deliverable = "Trame d'entretien et objections du secteur";
    } else if (/clos|conclu|proposition|devis|suivi/.test(kind)) {
      title = company ? `Formaliser une proposition pour ${company.name}` : "Formaliser une proposition";
      deliverable = "Proposition commerciale et plan de suivi";
    }
    return {
      id: skill.id,
      code: skill.code,
      competency: skill.title,
      title,
      description: `${skill.brief}. À mener pour ${place}. La mission doit rester proche des besoins de l'entreprise et des normes du secteur : ${practice}.`,
      deliverable,
    };
  });
}
