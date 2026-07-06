import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";

export function buildFallbackInterviewQuestions(
  skillName: string,
  level: HardSkillLevel,
  count: number,
  careerTitle?: string,
): string[] {
  const context = careerTitle ? ` dans le contexte de ${careerTitle}` : "";
  const pool = [
    `Décrivez une situation professionnelle récente où vous avez mobilisé la compétence « ${skillName} »${context}. Quel était l'enjeu et quel a été votre rôle ?`,
    `Quelles méthodes, outils ou bonnes pratiques utilisez-vous pour « ${skillName} » ? Illustrer avec un exemple concret.`,
    `Racontez un défi ou une difficulté rencontrée liée à « ${skillName} ». Comment l'avez-vous surmonté ?`,
    `Quels résultats mesurables ou impacts avez-vous obtenus grâce à « ${skillName} » ?`,
    `Comment adaptez-vous votre approche de « ${skillName} » selon le niveau d'exigence (${level}) ou le contexte ?`,
    `Avec qui collaborez-vous lorsque « ${skillName} » est au cœur du projet ? Comment coordonnez-vous les actions ?`,
    `Quelles erreurs ou pièges évitez-vous désormais sur « ${skillName} » ? Que feriez-vous différemment aujourd'hui ?`,
    `Comment vous formez-vous et restez-vous à jour sur « ${skillName} » ?`,
    `Présentez un livrable, une réalisation ou un cas d'usage qui démontre votre maîtrise de « ${skillName} ».`,
    `Si vous deviez former un collègue sur « ${skillName} », par quoi commenceriez-vous ?`,
    `Comment priorisez-vous les actions lorsque plusieurs sujets liés à « ${skillName} » sont urgents ?`,
    `Quels indicateurs utilisez-vous pour évaluer la qualité de votre pratique de « ${skillName} » ?`,
  ];

  return pool.slice(0, Math.max(1, Math.min(count, pool.length)));
}
