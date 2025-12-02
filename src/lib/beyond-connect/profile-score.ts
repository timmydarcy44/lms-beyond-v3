/**
 * Calcul du score de qualification du profil candidat
 */

export interface ProfileScoreData {
  hasPhoto: boolean;
  hasFirstName: boolean;
  hasLastName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasCity: boolean;
  hasBio: boolean;
  hasCV: boolean;
  experiencesCount: number;
  educationCount: number;
  hasEmploymentType: boolean;
}

/**
 * Calcule le score de qualification du profil (0-100)
 */
export function calculateProfileScore(data: ProfileScoreData): {
  score: number;
  maxScore: number;
  details: Array<{ label: string; points: number; maxPoints: number; missing: boolean }>;
} {
  const details: Array<{ label: string; points: number; maxPoints: number; missing: boolean }> = [];
  let score = 0;
  const maxScore = 100;

  // Photo de profil : -5 points si manquante
  const photoPoints = data.hasPhoto ? 5 : 0;
  details.push({
    label: "Photo de profil",
    points: photoPoints,
    maxPoints: 5,
    missing: !data.hasPhoto,
  });
  score += photoPoints;

  // Nom et prénom : obligatoires (10 points chacun)
  const firstNamePoints = data.hasFirstName ? 10 : 0;
  details.push({
    label: "Prénom",
    points: firstNamePoints,
    maxPoints: 10,
    missing: !data.hasFirstName,
  });
  score += firstNamePoints;

  const lastNamePoints = data.hasLastName ? 10 : 0;
  details.push({
    label: "Nom",
    points: lastNamePoints,
    maxPoints: 10,
    missing: !data.hasLastName,
  });
  score += lastNamePoints;

  // Email : obligatoire (5 points)
  const emailPoints = data.hasEmail ? 5 : 0;
  details.push({
    label: "Adresse email",
    points: emailPoints,
    maxPoints: 5,
    missing: !data.hasEmail,
  });
  score += emailPoints;

  // Téléphone : 5 points
  const phonePoints = data.hasPhone ? 5 : 0;
  details.push({
    label: "Numéro de téléphone",
    points: phonePoints,
    maxPoints: 5,
    missing: !data.hasPhone,
  });
  score += phonePoints;

  // Ville de résidence : 5 points
  const cityPoints = data.hasCity ? 5 : 0;
  details.push({
    label: "Ville de résidence",
    points: cityPoints,
    maxPoints: 5,
    missing: !data.hasCity,
  });
  score += cityPoints;

  // Bio : 10 points
  const bioPoints = data.hasBio ? 10 : 0;
  details.push({
    label: "Biographie",
    points: bioPoints,
    maxPoints: 10,
    missing: !data.hasBio,
  });
  score += bioPoints;

  // CV : 10 points
  const cvPoints = data.hasCV ? 10 : 0;
  details.push({
    label: "CV uploadé",
    points: cvPoints,
    maxPoints: 10,
    missing: !data.hasCV,
  });
  score += cvPoints;

  // Expériences : 5 points par expérience (max 15 points)
  const experiencePoints = Math.min(data.experiencesCount * 5, 15);
  details.push({
    label: `Expériences professionnelles (${data.experiencesCount})`,
    points: experiencePoints,
    maxPoints: 15,
    missing: data.experiencesCount === 0,
  });
  score += experiencePoints;

  // Formations : 5 points par formation (max 15 points)
  const educationPoints = Math.min(data.educationCount * 5, 15);
  details.push({
    label: `Formations/Diplômes (${data.educationCount})`,
    points: educationPoints,
    maxPoints: 15,
    missing: data.educationCount === 0,
  });
  score += educationPoints;

  // Type d'emploi recherché : 5 points
  const employmentTypePoints = data.hasEmploymentType ? 5 : 0;
  details.push({
    label: "Type d'emploi recherché",
    points: employmentTypePoints,
    maxPoints: 5,
    missing: !data.hasEmploymentType,
  });
  score += employmentTypePoints;

  return {
    score: Math.min(score, maxScore),
    maxScore,
    details,
  };
}

