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
