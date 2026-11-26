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
    where: "Fiches catalogue B2B + coffre admin (convention, règlement, livret)",
    how: "Ouvrir une fiche formation publique, puis Super → Qualiopi → Coffre : 3 modèles PDF déposés.",
    href: "/super/crm/qualiopi/catalogue",
  },
  {
    indicatorId: 2,
    title: "Indicateurs de résultats diffusés",
    where: "Bloc indicateurs sur fiche formation + questionnaires satisfaction sessions",
    how: "Montrer la méthode de calcul sur la fiche, puis une session avec retours satisfaction complets.",
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
    indicatorId: 12,
    title: "Engagement, ruptures, signalements VHD",
    where: "Process signalements + registre + sorties apprenant + alertes LMS",
    how: "Qualiopi → Qualité → Signalements (procédure prête) ; dossier → sorties / engagement.",
    href: "/super/crm/qualiopi/qualite",
  },
  {
    indicatorId: 19,
    title: "Ressources + suivi distanciel + référent pédagogique",
    where: "Catalogue / LMS + suivi distanciel dossier + multi-intervenants",
    how: "Ouvrir un dossier avec inscription LMS et, si ≥ 8 intervenants, le référent pédagogique coché.",
    href: "/super/crm/programmation",
  },
  {
    indicatorId: 27,
    title: "Sous-traitance / portage tracés",
    where: "Qualiopi → Formateurs (statut emploi + contrats SST)",
    how: "Montrer un expert salarié ou indépendant/portage avec contrat signé + engagement qualité.",
    href: "/super/crm/qualiopi/formateurs",
  },
  {
    indicatorId: 32,
    title: "Amélioration continue + analyse des risques",
    where: "Registre des risques + plan d’actions qualité (PAQ)",
    how: "Qualiopi → Risques (export PDF) puis Qualité → actions clôturées / revue.",
    href: "/super/crm/qualiopi/risques",
  },
];
