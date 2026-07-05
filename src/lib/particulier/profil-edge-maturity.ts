export type ProfessionalProject = {
  objectif?: string;
  metier_vise?: string;
  secteur?: string;
  mobilite?: string;
  disponibilite?: string;
};

export type ProfilEdgeMaturityBlockId =
  | "identite"
  | "projet"
  | "tests"
  | "experiences"
  | "diplomes"
  | "hard_skills";

export type ProfilEdgeMaturityBlock = {
  id: ProfilEdgeMaturityBlockId;
  label: string;
  weight: number;
  percent: number;
  complete: boolean;
  href: string;
};

export type ProfilEdgeMaturity = {
  totalPercent: number;
  blocks: ProfilEdgeMaturityBlock[];
};

export type HardSkillLevel = "Débutant" | "Intermédiaire" | "Confirmé" | "Expert";

export type LearnerHardSkillMeta = {
  level: HardSkillLevel;
  validated?: boolean;
  source?: "manual" | "badge";
};

export type ExperiencePro = {
  id: string;
  employeur: string | null;
  poste: string | null;
  type_contrat: string | null;
  date_debut: string | null;
  date_fin: string | null;
  missions: string | null;
  competences_developpees: string[];
};

export type Diplome = {
  id: string;
  intitule: string | null;
  ecole: string | null;
  annee_obtention: number | null;
  mode: string | null;
  diploma_type: string | null;
  niveau: string | null;
  description: string | null;
};

export const PROFIL_EDGE_SECTION_BASE = "/dashboard/apprenant/profil-comportemental";

export const PROFIL_EDGE_SECTION_HREFS: Record<ProfilEdgeMaturityBlockId, string> = {
  identite: `${PROFIL_EDGE_SECTION_BASE}/identite`,
  projet: `${PROFIL_EDGE_SECTION_BASE}/projet`,
  tests: `${PROFIL_EDGE_SECTION_BASE}/tests`,
  experiences: `${PROFIL_EDGE_SECTION_BASE}/experiences`,
  diplomes: `${PROFIL_EDGE_SECTION_BASE}/diplomes`,
  hard_skills: `${PROFIL_EDGE_SECTION_BASE}/hard-skills`,
};

function filled(value: unknown): boolean {
  return String(value ?? "").trim().length > 0;
}

export function parseProfessionalProject(raw: unknown): ProfessionalProject {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const row = raw as Record<string, unknown>;
  return {
    objectif: filled(row.objectif) ? String(row.objectif).trim() : undefined,
    metier_vise: filled(row.metier_vise) ? String(row.metier_vise).trim() : undefined,
    secteur: filled(row.secteur) ? String(row.secteur).trim() : undefined,
    mobilite: filled(row.mobilite) ? String(row.mobilite).trim() : undefined,
    disponibilite: filled(row.disponibilite) ? String(row.disponibilite).trim() : undefined,
  };
}

export function isProfessionalProjectComplete(project: ProfessionalProject): boolean {
  return (
    filled(project.objectif) &&
    filled(project.metier_vise) &&
    filled(project.secteur) &&
    filled(project.mobilite) &&
    filled(project.disponibilite)
  );
}

export function isIdentityComplete(profile: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  telephone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
}): boolean {
  const phone = profile.phone ?? profile.telephone;
  return (
    filled(profile.first_name) &&
    filled(profile.last_name) &&
    filled(profile.email) &&
    filled(phone) &&
    filled(profile.city) &&
    filled(profile.avatar_url)
  );
}

export function computeProfilEdgeMaturity(input: {
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    telephone?: string | null;
    city?: string | null;
    avatar_url?: string | null;
    professional_project?: unknown;
    hard_skills?: unknown;
  };
  hasDisc: boolean;
  hasSoftSkills: boolean;
  hasIdmc: boolean;
  experiencesCount: number;
  diplomasCount: number;
}): ProfilEdgeMaturity {
  const project = parseProfessionalProject(input.profile.professional_project);
  const hardSkills = Array.isArray(input.profile.hard_skills)
    ? (input.profile.hard_skills as unknown[]).map(String).filter((s) => s.trim())
    : [];

  const identityComplete = isIdentityComplete(input.profile);
  const projectComplete = isProfessionalProjectComplete(project);
  const testsCount = [input.hasDisc, input.hasSoftSkills, input.hasIdmc].filter(Boolean).length;
  const testsPercent = testsCount * 10;
  const experiencesComplete = input.experiencesCount > 0;
  const diplomasComplete = input.diplomasCount > 0;
  const hardSkillsComplete = hardSkills.length > 0;

  const blocks: ProfilEdgeMaturityBlock[] = [
    {
      id: "identite",
      label: "Identité",
      weight: 15,
      percent: identityComplete ? 15 : 0,
      complete: identityComplete,
      href: PROFIL_EDGE_SECTION_HREFS.identite,
    },
    {
      id: "projet",
      label: "Projet professionnel",
      weight: 15,
      percent: projectComplete ? 15 : 0,
      complete: projectComplete,
      href: PROFIL_EDGE_SECTION_HREFS.projet,
    },
    {
      id: "tests",
      label: "Tests EDGE",
      weight: 30,
      percent: testsPercent,
      complete: testsCount === 3,
      href: PROFIL_EDGE_SECTION_HREFS.tests,
    },
    {
      id: "experiences",
      label: "Expériences professionnelles",
      weight: 15,
      percent: experiencesComplete ? 15 : 0,
      complete: experiencesComplete,
      href: PROFIL_EDGE_SECTION_HREFS.experiences,
    },
    {
      id: "diplomes",
      label: "Diplômes",
      weight: 10,
      percent: diplomasComplete ? 10 : 0,
      complete: diplomasComplete,
      href: PROFIL_EDGE_SECTION_HREFS.diplomes,
    },
    {
      id: "hard_skills",
      label: "Hard Skills",
      weight: 15,
      percent: hardSkillsComplete ? 15 : 0,
      complete: hardSkillsComplete,
      href: PROFIL_EDGE_SECTION_HREFS.hard_skills,
    },
  ];

  const totalPercent = blocks.reduce((sum, b) => sum + b.percent, 0);

  return { totalPercent, blocks };
}
