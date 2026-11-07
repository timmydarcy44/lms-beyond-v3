import type { BpfFunderType, BpfLearnerStatus } from "@/lib/formation-dossier/constants";

export const BPF_FUNDER_LABELS: Record<BpfFunderType, string> = {
  entreprises_salaries: "Entreprises pour la formation de leurs salariés",
  opco: "OPCO",
  pouvoirs_publics: "Pouvoirs publics",
  cpf: "CPF",
  particuliers: "Particuliers",
  autres_of: "Autres organismes de formation",
  autres_produits: "Autres produits",
};

export const BPF_LEARNER_LABELS: Record<BpfLearnerStatus, string> = {
  salarie_prive: "Salariés d'employeur privé",
  apprenti: "Apprentis",
  demandeur_emploi: "Demandeurs d'emploi",
  particulier: "Particuliers à leurs frais",
  autre: "Autres stagiaires",
};

export const BPF_OBJECTIVE_LABELS: Record<string, string> = {
  rncp: "Certification RNCP",
  rs: "Répertoire spécifique (RS)",
  cqp: "CQP",
  autre: "Autres actions",
};

export const BPF_CHARGE_LABELS = {
  total_charges: "Total des charges de l'exercice",
  salaires_formateurs: "Salaires et charges des formateurs",
  achats_prestations_formation: "Achats de prestations de formation (sous-traitance donnée)",
} as const;
