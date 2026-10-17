export type EmployeeNextStep =
  | {
      kind: "bilan" | "formation" | "coaching";
      kicker: string;
      title: string;
      detail: string | null;
      cta: string;
      href: string | null;
    }
  | {
      kind: "empty";
      kicker: null;
      title: string;
      detail: string;
      cta: string;
      href: null;
    };

export type EmployeeNextStepFacts = {
  pendingBilan: { name: string; href: string; questionCount: number | null } | null;
  formation: {
    title: string;
    href: string;
    nextLeafTitle: string | null;
    complete: boolean;
  } | null;
  upcoming: { title: string; dateLabel: string; href: string | null } | null;
};

/** Premier cas vrai : bilan assigné, formation en cours, coaching planifié, sinon vide. */
export function resolveEmployeeNextStep(facts: EmployeeNextStepFacts): EmployeeNextStep {
  if (facts.pendingBilan) {
    const duration =
      facts.pendingBilan.questionCount != null
        ? `${facts.pendingBilan.questionCount} questions`
        : null;
    return {
      kind: "bilan",
      kicker: "Prochaine étape",
      title: `Compléter votre bilan ${facts.pendingBilan.name}`,
      detail: duration,
      cta: "Commencer",
      href: facts.pendingBilan.href,
    };
  }
  if (facts.formation && !facts.formation.complete) {
    return {
      kind: "formation",
      kicker: "Prochaine étape · formation assignée par votre entreprise",
      title: `Reprendre ${facts.formation.title}`,
      detail: facts.formation.nextLeafTitle
        ? `Prochain sous-chapitre : ${facts.formation.nextLeafTitle}`
        : null,
      cta: "Reprendre",
      href: facts.formation.href,
    };
  }
  if (facts.upcoming) {
    return {
      kind: "coaching",
      kicker: "Planifié par votre entreprise",
      title: `Votre ${facts.upcoming.title}`,
      detail: facts.upcoming.dateLabel,
      cta: facts.upcoming.href ? "Rejoindre" : "Voir",
      href: facts.upcoming.href,
    };
  }
  return {
    kind: "empty",
    kicker: null,
    title: "Aucune formation n'est prévue pour vous pour le moment",
    detail: "Vous serez prévenu dès que votre entreprise vous en proposera une.",
    cta: "Exprimer un besoin",
    href: null,
  };
}
