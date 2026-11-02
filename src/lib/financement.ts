/**
 * Chiffres de la page « Financer ma formation ».
 * Chaque montant a une source et une date de vérification.
 * Les réponses FAQ marquées TODO ne sont pas publiées dans le JSON-LD.
 */

export const FINANCEMENT_VERIFIE_LE = "2026-11-02" as const;

export type VerifiedFigure = {
  label: string;
  source: string;
  verifieLe: typeof FINANCEMENT_VERIFIE_LE;
};

function figure(label: string, source: string): VerifiedFigure {
  return { label, source, verifieLe: FINANCEMENT_VERIFIE_LE };
}

/** À confirmer par Darcy. */
export const FINANCEMENT_FLAGS = {
  cpfEligible: true,
  /** Si false : carte « Financement personnel » sans mention de paiement échelonné. */
  paiementEchelonne: false,
} as const;

export const FINANCEMENT_META = {
  title: "Financer ma formation | Byound",
  description:
    "Alternance gratuite et rémunérée, CPF, France Travail, Transitions Pro : trouvez le financement de votre formation Byound.",
} as const;

export const ALTERNANCE_RESTE_A_CHARGE = figure(
  "0 €",
  "Aucun frais de formation ne peut être demandé à un apprenti. Le coût est pris en charge par l'OPCO de l'entreprise.",
);

export const CPF_PARTICIPATION = figure(
  "150 €",
  "Participation forfaitaire du compte personnel de formation, en vigueur depuis le 2 avril 2026, sauf demandeurs d'emploi et abondement de l'employeur.",
);

export const CPF_DEMANDEUR_PARTICIPATION = figure(
  "0 €",
  "La participation forfaitaire du CPF ne s'applique pas aux demandeurs d'emploi.",
);

export const PLAN_DEVELOPPEMENT_RESTE = figure(
  "0 €",
  "Le plan de développement des compétences est financé par l'employeur. Aucun reste à charge n'est demandé au salarié.",
);

export const AIDE_HANDICAP = figure(
  "6 000 €",
  "Aide à l'embauche d'un apprenti reconnu travailleur handicapé, quelle que soit la taille de l'entreprise. Décret n° 2026-168 du 6 mars 2026.",
);

export const AIDE_EMBAUCHE = {
  caption: "Aide à l'embauche d'un apprenti, montants maximums de la première année.",
  columns: ["Moins de 250 salariés", "250 salariés et plus"] as const,
  rows: [
    {
      diploma: "Niveaux 3 et 4 (CAP, bac)",
      small: figure("5 000 €", "Décret n° 2026-168 du 6 mars 2026, entreprises de moins de 250 salariés, niveaux 3 et 4."),
      large: figure("2 000 €", "Décret n° 2026-168 du 6 mars 2026, entreprises de 250 salariés et plus, niveaux 3 et 4."),
    },
    {
      diploma: "Niveau 5 (bac +2)",
      small: figure("4 500 €", "Décret n° 2026-168 du 6 mars 2026, entreprises de moins de 250 salariés, niveau 5."),
      large: figure("1 500 €", "Décret n° 2026-168 du 6 mars 2026, entreprises de 250 salariés et plus, niveau 5."),
    },
    {
      diploma: "Niveaux 6 et 7 (bac +3 à bac +5)",
      small: figure("2 000 €", "Décret n° 2026-168 du 6 mars 2026, entreprises de moins de 250 salariés, niveaux 6 et 7."),
      large: figure("750 €", "Décret n° 2026-168 du 6 mars 2026, entreprises de 250 salariés et plus, niveaux 6 et 7."),
    },
  ],
  mention:
    "Montants maximums versés au titre de la 1re année, pour les contrats conclus à partir du 8 mars 2026 et débutant avant le 1er janvier 2027 (décret n° 2026-168 du 6 mars 2026).",
} as const;

export const CPF_NOTE =
  "* Le CPF finance uniquement les formations éligibles (certifications inscrites au RNCP ou au Répertoire spécifique). Le reste à charge de 150 € s'applique depuis le 2 avril 2026, sauf pour les demandeurs d'emploi et lorsque l'employeur abonde le compte.";

export type SituationId = "etudiant" | "salarie" | "demandeur" | "reconversion" | "entreprise";

export const SITUATIONS: { id: SituationId; label: string }[] = [
  { id: "etudiant", label: "Étudiant ou jeune diplômé" },
  { id: "salarie", label: "Salarié" },
  { id: "demandeur", label: "Demandeur d'emploi" },
  { id: "reconversion", label: "En reconversion" },
  { id: "entreprise", label: "Entreprise" },
];

export type SituationCard = {
  tone: "dark" | "light";
  eyebrow?: string;
  title: string;
  text: string;
  facts?: { label: string; value: string; paid?: boolean }[];
  href?: string;
  cta?: string;
};

export function situationCards(
  id: SituationId,
  hrefs: { offres: string; recruter: string },
): SituationCard[] {
  if (id === "etudiant") {
    return [
      {
        tone: "dark",
        eyebrow: "Recommandé pour vous",
        title: "L'alternance",
        text: "Votre formation est gratuite. Vous signez un contrat avec une entreprise et vous êtes rémunéré.",
        facts: [
          { label: "Frais de formation", value: ALTERNANCE_RESTE_A_CHARGE.label },
          { label: "Salaire", value: "Payé", paid: true },
          { label: "Rythme", value: "École et entreprise" },
        ],
      },
      {
        tone: "light",
        title: "Conditions",
        text: "16 à 29 ans à la signature du contrat. Pas de limite d'âge pour les personnes en situation de handicap.",
      },
      {
        tone: "light",
        title: "Pas encore d'entreprise ?",
        text: "Vous pouvez candidater à Byound, puis chercher une entreprise. Les offres d'alternance sont ouvertes.",
        href: hrefs.offres,
        cta: "Voir les offres",
      },
    ];
  }
  if (id === "salarie") {
    return [
      {
        tone: "dark",
        eyebrow: "Recommandé pour vous",
        title: "Plan de développement des compétences",
        text: "Votre employeur inscrit la formation à son plan. Le reste à charge pour vous est de 0 €.",
        facts: [{ label: "Pour vous", value: PLAN_DEVELOPPEMENT_RESTE.label }],
      },
      ...(FINANCEMENT_FLAGS.cpfEligible
        ? [
            {
              tone: "light" as const,
              title: "Compte personnel de formation",
              text: "Vos droits financent la formation. Une participation forfaitaire de 150 € s'applique, sauf abondement de l'employeur.",
              facts: [{ label: "Participation", value: CPF_PARTICIPATION.label }],
            },
          ]
        : []),
      {
        tone: "light",
        title: "Transitions Pro",
        text: "Pour un projet de transition professionnelle, avec maintien de la rémunération selon les conditions du dispositif.",
      },
    ];
  }
  if (id === "demandeur") {
    return [
      {
        tone: "dark",
        eyebrow: "Recommandé pour vous",
        title: "CPF sans participation forfaitaire",
        text: "La participation forfaitaire du CPF ne s'applique pas aux demandeurs d'emploi.",
        facts: [{ label: "Participation CPF", value: CPF_DEMANDEUR_PARTICIPATION.label }],
      },
      {
        tone: "light",
        title: "AIF France Travail",
        text: "L'aide individuelle à la formation peut compléter le financement, après accord de votre conseiller France Travail.",
      },
      {
        tone: "light",
        title: "On monte le dossier avec vous",
        text: "Un conseiller Byound regarde votre situation et les pièces à réunir, sans engagement.",
        href: "#contact-conseiller",
        cta: "Parler à un conseiller",
      },
    ];
  }
  if (id === "reconversion") {
    return [
      {
        tone: "dark",
        eyebrow: "Recommandé pour vous",
        title: "Transitions Pro (PTP)",
        text: "Le projet de transition professionnelle permet de se former à un nouveau métier, avec une rémunération selon les conditions du dispositif.",
      },
      ...(FINANCEMENT_FLAGS.cpfEligible
        ? [
            {
              tone: "light" as const,
              title: "Compte personnel de formation",
              text: "Le CPF peut financer une certification éligible. La participation forfaitaire de 150 € s'applique hors exceptions.",
              facts: [{ label: "Participation", value: CPF_PARTICIPATION.label }],
            },
          ]
        : []),
      {
        tone: "light",
        title: "On vérifie l'éligibilité",
        text: "Le bon dispositif dépend de votre statut. Un conseiller le confirme avec vous.",
        href: "#contact-conseiller",
        cta: "Être rappelé",
      },
    ];
  }
  return [
    {
      tone: "dark",
      eyebrow: "Recommandé pour vous",
      title: "Aide à l'embauche d'un apprenti",
      text: "L'aide dépend du niveau préparé et de la taille de l'entreprise. Le détail est dans le tableau.",
      href: "#recruter",
      cta: "Voir les montants",
    },
    {
      tone: "light",
      title: "Travailleur handicapé",
      text: `${AIDE_HANDICAP.label} pour un apprenti reconnu travailleur handicapé, quelle que soit la taille de l'entreprise.`,
    },
    {
      tone: "light",
      title: "Recruter un alternant Byound",
      text: "Présentez votre besoin. L'équipe entreprises revient vers vous.",
      href: hrefs.recruter,
      cta: "Recruter un alternant Byound",
    },
  ];
}

export type SolutionCard = {
  id: string;
  abbr: string;
  audience: string;
  title: string;
  text: string;
  keyLabel: string;
  keyValue: string;
};

export function solutionCards(): SolutionCard[] {
  const cards: SolutionCard[] = [
    {
      id: "alternance",
      abbr: "ALT",
      audience: "16 à 29 ans",
      title: "Alternance",
      text: "Formation gratuite et rémunérée, avec un contrat en entreprise.",
      keyLabel: "Reste à charge",
      keyValue: ALTERNANCE_RESTE_A_CHARGE.label,
    },
    {
      id: "cpf",
      abbr: "CPF",
      audience: "Salariés",
      title: "Compte personnel de formation*",
      text: "Vos droits financent une certification éligible.",
      keyLabel: "Participation forfaitaire",
      keyValue: CPF_PARTICIPATION.label,
    },
    {
      id: "france-travail",
      abbr: "FT",
      audience: "Demandeurs d'emploi",
      title: "France Travail",
      text: "La participation forfaitaire du CPF ne s'applique pas.",
      keyLabel: "Participation forfaitaire CPF",
      keyValue: CPF_DEMANDEUR_PARTICIPATION.label,
    },
    {
      id: "ptp",
      abbr: "PTP",
      audience: "Reconversion",
      title: "Projet de transition professionnelle",
      text: "Pour changer de métier, avec une rémunération selon les conditions du dispositif.",
      keyLabel: "Rémunération",
      keyValue: "Maintenue",
    },
    {
      id: "plan",
      abbr: "PDC",
      audience: "Salariés",
      title: "Plan de développement des compétences",
      text: "La formation est inscrite au plan de votre employeur.",
      keyLabel: "Pour vous",
      keyValue: PLAN_DEVELOPPEMENT_RESTE.label,
    },
    {
      id: "personnel",
      abbr: "PER",
      audience: "Tous profils",
      title: "Financement personnel",
      text: FINANCEMENT_FLAGS.paiementEchelonne
        ? "Paiement en plusieurs fois, sans frais."
        : "Vous financez la formation vous-même.",
      keyLabel: FINANCEMENT_FLAGS.paiementEchelonne ? "Échelonnement" : "",
      keyValue: FINANCEMENT_FLAGS.paiementEchelonne ? "Sans frais" : "",
    },
  ];
  return cards.filter((card) => FINANCEMENT_FLAGS.cpfEligible || card.id !== "cpf");
}

export type PriceCase = {
  id: string;
  title: string;
  amount: string;
  text: string;
};

export function priceCases(): PriceCase[] {
  const cases: PriceCase[] = [
    {
      id: "alternant",
      title: "Alternant",
      amount: ALTERNANCE_RESTE_A_CHARGE.label,
      text: "Votre formation est prise en charge. Vous êtes rémunéré chaque mois.",
    },
    {
      id: "salarie-cpf",
      title: "Salariée avec droits CPF suffisants",
      amount: CPF_PARTICIPATION.label,
      text: "Participation forfaitaire, si vos droits couvrent le reste.",
    },
    {
      id: "demandeur",
      title: "Demandeur d'emploi, CPF et France Travail",
      amount: CPF_DEMANDEUR_PARTICIPATION.label,
      text: "La participation forfaitaire du CPF ne s'applique pas.",
    },
  ];
  return cases.filter((item) => FINANCEMENT_FLAGS.cpfEligible || item.id !== "salarie-cpf");
}

export const DOSSIER_STEPS = [
  { n: "1", title: "Vous choisissez", text: "Vous indiquez votre situation et la formation visée." },
  { n: "2", title: "On vous rappelle", text: "Un conseiller reprend votre cas et les dispositifs possibles." },
  { n: "3", title: "On monte le dossier", text: "On prépare les pièces avec vous, auprès du bon organisme." },
  { n: "4", title: "Vous commencez", text: "Le financement est confirmé, la formation démarre." },
] as const;

export type FaqItem = {
  question: string;
  /** null = réponse à valider par Darcy, absente du JSON-LD. */
  answer: string | null;
};

export const FINANCEMENT_FAQ: FaqItem[] = [
  {
    question: "L'alternance est-elle vraiment gratuite pour moi ?",
    answer:
      "Oui. Aucun frais de formation ne peut être demandé à un apprenti. Le coût est pris en charge par l'OPCO de l'entreprise qui vous recrute, et vous percevez un salaire pendant toute la durée du contrat.",
  },
  {
    question: "Puis-je combiner le CPF avec une autre aide ?",
    answer: null, // TODO Darcy
  },
  {
    question: "Comment savoir si une formation est éligible au CPF ?",
    answer: null, // TODO Darcy
  },
  {
    question: "Je n'ai pas encore trouvé d'entreprise, puis-je m'inscrire ?",
    answer: null, // TODO Darcy
  },
  {
    question: "Que se passe-t-il si mon contrat est rompu ?",
    answer: null, // TODO Darcy
  },
];

export function validatedFaq() {
  return FINANCEMENT_FAQ.filter((item): item is { question: string; answer: string } => Boolean(item.answer));
}

export const HERO_PLAN = {
  title: "Mon plan de financement",
  context: "NTC Business Sport · alternance",
  restLabel: "Reste à charge pour vous",
  rest: ALTERNANCE_RESTE_A_CHARGE,
  paid: "Et vous êtes payé chaque mois",
  rows: [
    { label: "Frais de formation", value: "Couvert" },
    { label: "Salaire apprenti", value: "Chaque mois" },
    { label: "Accompagnement Byound", value: "Inclus" },
  ],
} as const;
