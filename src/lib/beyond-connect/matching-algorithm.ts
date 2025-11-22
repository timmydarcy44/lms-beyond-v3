/**
 * Algorithme de matching pour Beyond Connect
 * Compare les profils candidats avec les offres d'emploi
 */

type UserProfile = {
  userId: string;
  skills: Array<{ name: string; level?: string; category?: string }>;
  experiences: Array<{ title: string; company: string; start_date: string; end_date?: string; is_current: boolean }>;
  education: Array<{ degree: string; field_of_study?: string; end_date?: string }>;
  certifications: Array<{ name: string; issuer: string }>;
  badges: Array<{ code: string; label: string }>;
  testResults: Array<{ test_title: string; score: number }>;
};

type JobOffer = {
  id: string;
  required_skills: string[];
  required_experience?: string; // "junior", "mid", "senior"
  required_education?: string; // "bac", "bac+2", "bac+3", "bac+5"
  contract_type: string;
  location?: string;
  remote_allowed?: boolean;
};

type MatchResult = {
  match_score: number; // 0-100
  skills_match: number; // 0-100
  experience_match: number; // 0-100
  education_match: number; // 0-100
  details: {
    matched_skills: string[];
    missing_skills: string[];
    experience_level: string;
    education_level: string;
    badges_count: number;
    test_results_count: number;
  };
};

/**
 * Calcule le score de matching entre un profil utilisateur et une offre d'emploi
 */
export async function calculateMatchScore(
  userProfile: UserProfile,
  jobOffer: JobOffer
): Promise<MatchResult> {
  // 1. Matching des compétences (poids: 40%)
  const skillsMatch = calculateSkillsMatch(userProfile.skills, jobOffer.required_skills);
  
  // 2. Matching de l'expérience (poids: 30%)
  const experienceMatch = calculateExperienceMatch(userProfile.experiences, jobOffer.required_experience);
  
  // 3. Matching de la formation (poids: 20%)
  const educationMatch = calculateEducationMatch(userProfile.education, jobOffer.required_education);
  
  // 4. Bonus pour badges et tests (poids: 10%)
  const bonusScore = calculateBonusScore(userProfile.badges, userProfile.testResults);
  
  // Calcul du score global (pondéré)
  const matchScore = Math.round(
    skillsMatch * 0.4 +
    experienceMatch * 0.3 +
    educationMatch * 0.2 +
    bonusScore * 0.1
  );

  // Détails du matching
  const matchedSkills = userProfile.skills
    .filter(skill => 
      jobOffer.required_skills.some(required => 
        skill.name.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.name.toLowerCase())
      )
    )
    .map(skill => skill.name);

  const missingSkills = jobOffer.required_skills.filter(required =>
    !userProfile.skills.some(skill =>
      skill.name.toLowerCase().includes(required.toLowerCase()) ||
      required.toLowerCase().includes(skill.name.toLowerCase())
    )
  );

  const experienceLevel = determineExperienceLevel(userProfile.experiences);
  const educationLevel = determineEducationLevel(userProfile.education);

  return {
    match_score: Math.min(100, Math.max(0, matchScore)),
    skills_match: Math.round(skillsMatch),
    experience_match: Math.round(experienceMatch),
    education_match: Math.round(educationMatch),
    details: {
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      experience_level: experienceLevel,
      education_level: educationLevel,
      badges_count: userProfile.badges.length,
      test_results_count: userProfile.testResults.length,
    },
  };
}

/**
 * Calcule le score de matching des compétences
 */
function calculateSkillsMatch(
  userSkills: Array<{ name: string; level?: string }>,
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 100;
  if (userSkills.length === 0) return 0;

  let matchedCount = 0;
  const normalizedUserSkills = userSkills.map(s => s.name.toLowerCase().trim());
  const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

  for (const required of normalizedRequiredSkills) {
    // Recherche exacte ou partielle
    const matched = normalizedUserSkills.some(userSkill => {
      return userSkill.includes(required) || required.includes(userSkill);
    });

    if (matched) {
      matchedCount++;
    }
  }

  return (matchedCount / requiredSkills.length) * 100;
}

/**
 * Calcule le score de matching de l'expérience
 */
function calculateExperienceMatch(
  experiences: Array<{ start_date: string; end_date?: string; is_current: boolean }>,
  requiredExperience?: string
): number {
  if (!requiredExperience) return 100;

  const totalMonths = calculateTotalExperienceMonths(experiences);
  const userLevel = determineExperienceLevelFromMonths(totalMonths);

  const levelHierarchy: Record<string, number> = {
    junior: 1,
    mid: 2,
    senior: 3,
  };

  const requiredLevel = levelHierarchy[requiredExperience.toLowerCase()] || 1;
  const userLevelNum = levelHierarchy[userLevel.toLowerCase()] || 1;

  if (userLevelNum >= requiredLevel) {
    return 100;
  } else if (userLevelNum === requiredLevel - 1) {
    return 70; // Proche mais pas tout à fait
  } else {
    return 40; // Trop junior
  }
}

/**
 * Calcule le score de matching de la formation
 */
function calculateEducationMatch(
  education: Array<{ degree: string; field_of_study?: string; end_date?: string }>,
  requiredEducation?: string
): number {
  if (!requiredEducation) return 100;
  if (education.length === 0) return 0;

  const educationHierarchy: Record<string, number> = {
    bac: 1,
    "bac+2": 2,
    "bac+3": 3,
    "bac+5": 5,
    master: 5,
    doctorat: 6,
  };

  const requiredLevel = educationHierarchy[requiredEducation.toLowerCase()] || 0;
  
  // Trouve le niveau d'éducation le plus élevé
  let maxUserLevel = 0;
  for (const edu of education) {
    // Essaie de détecter le niveau depuis le nom du diplôme
    const degreeLower = edu.degree.toLowerCase();
    if (degreeLower.includes("doctorat") || degreeLower.includes("phd")) {
      maxUserLevel = Math.max(maxUserLevel, 6);
    } else if (degreeLower.includes("master") || degreeLower.includes("bac+5")) {
      maxUserLevel = Math.max(maxUserLevel, 5);
    } else if (degreeLower.includes("licence") || degreeLower.includes("bac+3")) {
      maxUserLevel = Math.max(maxUserLevel, 3);
    } else if (degreeLower.includes("bts") || degreeLower.includes("dut") || degreeLower.includes("bac+2")) {
      maxUserLevel = Math.max(maxUserLevel, 2);
    } else if (degreeLower.includes("bac")) {
      maxUserLevel = Math.max(maxUserLevel, 1);
    }
  }

  if (maxUserLevel >= requiredLevel) {
    return 100;
  } else if (maxUserLevel === requiredLevel - 1) {
    return 70;
  } else {
    return 40;
  }
}

/**
 * Calcule le score bonus basé sur les badges et résultats de tests
 */
function calculateBonusScore(
  badges: Array<{ code: string; label: string }>,
  testResults: Array<{ test_title: string; score: number }>
): number {
  let bonus = 0;

  // Bonus pour les badges (max 5 points)
  if (badges.length > 0) {
    bonus += Math.min(5, badges.length * 1);
  }

  // Bonus pour les tests avec bons scores (max 5 points)
  const goodTestResults = testResults.filter(tr => tr.score >= 70);
  if (goodTestResults.length > 0) {
    bonus += Math.min(5, goodTestResults.length * 1);
  }

  return Math.min(100, bonus * 10); // Convertir en pourcentage
}

/**
 * Détermine le niveau d'expérience à partir des expériences
 */
function determineExperienceLevel(
  experiences: Array<{ start_date: string; end_date?: string; is_current: boolean }>
): string {
  const totalMonths = calculateTotalExperienceMonths(experiences);
  return determineExperienceLevelFromMonths(totalMonths);
}

/**
 * Calcule le nombre total de mois d'expérience
 */
function calculateTotalExperienceMonths(
  experiences: Array<{ start_date: string; end_date?: string; is_current: boolean }>
): number {
  let totalMonths = 0;

  for (const exp of experiences) {
    const start = new Date(exp.start_date);
    const end = exp.is_current ? new Date() : (exp.end_date ? new Date(exp.end_date) : new Date());
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }

  return totalMonths;
}

/**
 * Détermine le niveau d'expérience à partir du nombre de mois
 */
function determineExperienceLevelFromMonths(months: number): string {
  if (months < 12) {
    return "junior";
  } else if (months < 36) {
    return "mid";
  } else {
    return "senior";
  }
}

/**
 * Détermine le niveau d'éducation le plus élevé
 */
function determineEducationLevel(
  education: Array<{ degree: string; field_of_study?: string }>
): string {
  if (education.length === 0) return "non spécifié";

  let maxLevel = 0;
  let maxLevelName = "bac";

  for (const edu of education) {
    const degreeLower = edu.degree.toLowerCase();
    if (degreeLower.includes("doctorat") || degreeLower.includes("phd")) {
      if (maxLevel < 6) {
        maxLevel = 6;
        maxLevelName = "doctorat";
      }
    } else if (degreeLower.includes("master") || degreeLower.includes("bac+5")) {
      if (maxLevel < 5) {
        maxLevel = 5;
        maxLevelName = "bac+5";
      }
    } else if (degreeLower.includes("licence") || degreeLower.includes("bac+3")) {
      if (maxLevel < 3) {
        maxLevel = 3;
        maxLevelName = "bac+3";
      }
    } else if (degreeLower.includes("bts") || degreeLower.includes("dut") || degreeLower.includes("bac+2")) {
      if (maxLevel < 2) {
        maxLevel = 2;
        maxLevelName = "bac+2";
      }
    } else if (degreeLower.includes("bac")) {
      if (maxLevel < 1) {
        maxLevel = 1;
        maxLevelName = "bac";
      }
    }
  }

  return maxLevelName;
}

