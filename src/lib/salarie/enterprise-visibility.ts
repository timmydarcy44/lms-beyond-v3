import type { EnterpriseShareConsentRow } from "@/lib/entreprise/enterprise-share-consent";

export type EnterpriseVisibilityItem = {
  id: string;
  label: string;
  shared: boolean;
};

/**
 * Ce que le RH voit aujourd'hui, d'après le code (pas un texte marketing).
 * - Liste collaborateurs : nom, e-mail, poste, département, bilan terminé oui/non,
 *   score IDMC seulement s'il est partagé, formation assignée oui/non.
 * - Fiche : scores DISC / IDMC / soft skills seulement si le consentement
 *   correspondant est coché (maskTestResultsForEnterprise).
 * - Compétences déclarées et preuves : absentes des réponses entreprise.
 */
export function enterpriseVisibilityForEmployee(
  consent: EnterpriseShareConsentRow | null,
): EnterpriseVisibilityItem[] {
  const given = Boolean(consent?.consentement_donne);
  return [
    {
      id: "identity",
      label: "Votre nom, votre e-mail, votre poste et votre département",
      shared: true,
    },
    {
      id: "diagnostic-status",
      label: "Le fait qu'un bilan est commencé ou terminé, sans le détail des réponses",
      shared: true,
    },
    {
      id: "formation-flag",
      label: "Le fait qu'une formation vous est assignée",
      shared: true,
    },
    {
      id: "disc",
      label: "Vos résultats DISC (profil et scores)",
      shared: given && Boolean(consent?.disc_shared),
    },
    {
      id: "idmc",
      label: "Vos résultats IDMC (score et axes)",
      shared: given && Boolean(consent?.idmc_shared),
    },
    {
      id: "soft",
      label: "Vos scores soft skills, compétence par compétence",
      shared: given && Boolean(consent?.soft_skills_shared),
    },
    {
      id: "skills",
      label: "Vos compétences déclarées",
      shared: false,
    },
    {
      id: "proofs",
      label: "Les preuves déposées sur vos compétences",
      shared: false,
    },
  ];
}
