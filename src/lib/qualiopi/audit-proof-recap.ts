/** Récap auditeur — où montrer la preuve en < 1 min (livrable Lots 1–7). */

export type QualiopiAuditProofRecap = {
  indicatorId: number;
  title: string;
  where: string;
  how: string;
  href: string;
};

export const QUALIOPI_AUDIT_PROOF_RECAP: QualiopiAuditProofRecap[] = [
  {
    indicatorId: 1,
    title: "Information publique accessible et vérifiable",
    where: "Page publique des formations + Super → Formations",
    how: "Ouvrir une fiche publique, puis https://www.byound.fr/super/formations.",
    href: "/super/formations",
  },
  {
    indicatorId: 2,
    title: "Indicateurs de résultats diffusés",
    where: "Catalogue Qualiopi + bloc indicateurs sur fiche publique",
    how: "Ouvrir /super/crm/qualiopi/catalogue, puis la fiche publique (#qualite).",
    href: "/super/crm/qualiopi/catalogue",
  },
  {
    indicatorId: 9,
    title: "Informations remises au bénéficiaire",
    where:
      "Pack information (convention / règlement / livret) + Programmation + exemple de convocation",
    how: "Ouvrir Programmation (dossier démarré), montrer les envois du pack, puis ouvrir une convocation exemple (/doc?token=…).",
    href: "/super/crm/programmation",
  },
  {
    indicatorId: 11,
    title: "Évaluation de l’atteinte des objectifs",
    where: "Super → Formations (édition) → boutons évaluation à chaud / à froid",
    how: "Ouvrir une formation au hasard dans /super/formations, cliquer « évaluation à chaud » puis « à froid ».",
    href: "/super/formations",
  },
  {
    indicatorId: 12,
    title: "Engagement, ruptures, signalements VHD",
    where: "Process signalements + registre + sorties apprenant + alertes LMS",
    how: "Qualiopi → Qualité → Signalements (procédure prête) ; dossier → sorties / engagement.",
    href: "/super/crm/qualiopi/qualite",
  },
  {
    indicatorId: 17,
    title: "Moyens humains et techniques",
    where: "Procédure moyens + Formateurs/experts (RH) + annuaire experts",
    how: "Montrer la procédure Moyens, puis l’onglet Formateurs/experts pour les RH.",
    href: "/super/crm/qualiopi/formateurs",
  },
  {
    indicatorId: 19,
    title: "Ressources + suivi distanciel + référent pédagogique",
    where: "Catalogue / LMS + suivi distanciel dossier + multi-intervenants",
    how: "Ouvrir un dossier avec inscription LMS et, si ≥ 8 intervenants, le référent pédagogique coché.",
    href: "/super/crm/programmation",
  },
  {
    indicatorId: 21,
    title: "Compétences des intervenants",
    where: "Fiche Jérôme Picot + onglet Bilans",
    how: "Ouvrir /super/experts/{id} puis l’onglet Bilans (tests compétences).",
    href: "/super/experts/fcfb29ae-3398-421f-b4bf-9244b2be5572?tab=bilans",
  },
  {
    indicatorId: 27,
    title: "Sous-traitance / portage tracés",
    where: "Qualiopi → Formateurs (statut emploi + contrats SST)",
    how: "Montrer un expert salarié ou indépendant/portage avec contrat signé + engagement qualité.",
    href: "/super/crm/qualiopi/formateurs",
  },
  {
    indicatorId: 30,
    title: "Recueil des appréciations",
    where: "Test évaluation à chaud",
    how: "Ouvrir /a/preview?kind=eval_chaud et montrer le questionnaire remis aux bénéficiaires.",
    href: "/a/preview?kind=eval_chaud",
  },
  {
    indicatorId: 32,
    title: "Amélioration continue + analyse des risques",
    where: "Registre des risques + plan d’actions qualité (PAQ)",
    how: "Qualiopi → Risques (export PDF) puis Qualité → actions clôturées / revue.",
    href: "/super/crm/qualiopi/risques",
  },
];
