import { z } from "zod";

/**
 * Textes et faits de la page « Financement OPCO ».
 * Chaque fait réglementaire a une source et une date de vérification.
 * Les réponses FAQ nulles ne sont pas publiées dans le JSON-LD.
 */

export const OPCO_VERIFIE_LE = "2026-11-02" as const;

export type Sourced = {
  text: string;
  source: string;
  verifieLe: typeof OPCO_VERIFIE_LE;
};

function sourced(text: string, source: string): Sourced {
  return { text, source, verifieLe: OPCO_VERIFIE_LE };
}

/** À confirmer par Darcy. */
export const OPCO_FLAGS = {
  qualiopi: false,
  /** Affiché seulement si qualiopi est true et le numéro est renseigné. */
  qualiopiCertificat: "",
  subrogation: false,
} as const;

export const OPCO_META = {
  title: "Financement OPCO de vos formations | Byound",
  description:
    "Plan de développement des compétences, alternance, période de reconversion : on identifie ce que votre OPCO peut financer et on prépare le dossier avec vous.",
} as const;

export const OPCO_COUNT = sourced(
  "11",
  "France Compétences, liste des opérateurs de compétences agréés.",
);

export const OPCO_PER_COMPANY = sourced(
  "1",
  "France Compétences : une entreprise relève d'un seul opérateur de compétences, selon son activité principale et la convention collective applicable.",
);

export const OPCO_MUTUAL_THRESHOLD = sourced(
  "< 50",
  "Loi n° 2018-771 du 5 septembre 2018 : les entreprises de moins de 50 salariés peuvent mobiliser les fonds mutualisés de leur OPCO pour le plan de développement des compétences.",
);

export const PLAN_MOINS_50 = {
  tag: "Fonds mutualisés",
  title: "Plan de développement des compétences",
  text: "L'OPCO peut financer les actions de formation de vos salariés, selon la grille de votre branche.",
  foot: "Demande à faire avant le début de la formation.",
  source: OPCO_MUTUAL_THRESHOLD.source,
};

export const PLAN_PLUS_50 = {
  tag: "Financé par l'entreprise",
  title: "Plan de développement des compétences",
  text: "En principe financé par l'entreprise, sauf contributions volontaires ou conventionnelles versées à l'OPCO.",
  foot: "Demande à faire avant le début de la formation.",
  source: OPCO_MUTUAL_THRESHOLD.source,
};

export const ALTERNANCE_CARD = {
  tag: "Toutes tailles",
  title: "Alternance",
  text: "L'OPCO finance la formation selon le niveau de prise en charge fixé pour le titre préparé.",
  foot: sourced(
    "Depuis le 1er septembre 2026 · Nouveaux niveaux de prise en charge",
    "Date indiquée dans le brief du 2 novembre 2026. Référence France Compétences des niveaux de prise en charge à confirmer par Darcy.",
  ),
  linkLabel: "Recruter un alternant",
};

export const RECONVERSION_CARD = {
  tag: "Toutes tailles",
  title: "Période de reconversion",
  text: "Un salarié change de métier ou évolue en interne grâce à une formation certifiante. Elle remplace la Pro-A depuis 2026.",
  foot: sourced(
    "150 à 450 h de formation, sur 12 mois maximum.",
    "Durée du dispositif de reconversion indiquée dans le brief du 2 novembre 2026. La Pro-A encadre des actions de 150 à 450 heures sur 12 mois. Le remplacement par la période de reconversion est à confirmer par Darcy.",
  ),
};

export const COVERAGE_NOTE =
  "Les niveaux de prise en charge sont fixés par les branches professionnelles et révisés chaque année. On vérifie la grille à jour de votre OPCO avant de chiffrer.";

export const COVERED_INTRO =
  "Les montants et plafonds sont fixés par chaque OPCO et chaque branche, et révisés chaque année. On vérifie la grille à jour de votre OPCO avant tout devis.";

export const COVERED_ROWS = [
  { title: "Coûts pédagogiques", text: "Le coût de la formation elle-même.", pill: "Principal", tone: "green" as const },
  { title: "Frais annexes", text: "Transport, hébergement, repas : selon le barème de votre OPCO.", pill: "Selon barème", tone: "glass" as const },
  { title: "Rémunération pendant la formation", text: "Elle dépend de votre branche et du dispositif.", pill: "Selon branche", tone: "glass" as const },
];

export const SUBROGATION_LINE =
  "Byound facture directement votre OPCO : vous n'avancez pas les frais.";

export const DOSSIER_STEPS = [
  { n: "1", title: "On identifie votre OPCO", text: "À partir de votre convention collective et de votre activité." },
  { n: "2", title: "On vérifie la grille", text: "Le niveau de prise en charge de votre branche, à jour." },
  { n: "3", title: "On prépare le dossier", text: "Devis, programme, objectifs et pièces à joindre." },
  { n: "4", title: "Vous déposez la demande", text: "Sur l'espace de votre OPCO, avant le début de la formation." },
  { n: "5", title: "Vos équipes se forment", text: "Présentiel, distanciel ou les deux, avec suivi des compétences." },
];

export const DEPOSIT_EARLY =
  "Déposez tôt dans l'année. Les enveloppes des OPCO sont limitées et la demande doit être faite avant le début de la formation.";

export const HERO_DOSSIER = {
  title: "Dossier de prise en charge · IA Business · 8 collaborateurs",
  status: "Demande déposée",
  step: "Étape 3 sur 4 · en attente de l'accord de l'OPCO",
  rows: [
    { label: "OPCO identifié", value: "Fait", tone: "done" as const },
    { label: "Devis et programme", value: "Fait", tone: "done" as const },
    { label: "Accord de prise en charge", value: "En cours", tone: "progress" as const },
    { label: "Formation", value: "À venir", tone: "later" as const },
  ],
};

export const SIZE_TABS = [
  { id: "moins-50" as const, label: "Moins de 50 salariés" },
  { id: "plus-50" as const, label: "50 salariés et plus" },
];

export type SizeTabId = (typeof SIZE_TABS)[number]["id"];

export const EFFECTIF_OPTIONS = [
  { value: "moins-11", label: "Moins de 11" },
  { value: "11-49", label: "11 à 49" },
  { value: "50-249", label: "50 à 249" },
  { value: "250-plus", label: "250 et plus" },
] as const;

export type EffectifValue = (typeof EFFECTIF_OPTIONS)[number]["value"];

export type FormationOption = { id: string; title: string };

export const OPCO_LEAD_SOURCE = "financement-opco";

const FAQ_BASE: { id: string; question: string; answer: string | null }[] = [
  {
    id: "quel-opco",
    question: "Comment savoir de quel OPCO dépend mon entreprise ?",
    answer: "Il est déterminé par votre convention collective et votre activité principale. Donnez-nous votre SIRET : on l'identifie pour vous.",
  },
  {
    id: "plus-50",
    question: "Mon entreprise de plus de 50 salariés peut-elle être financée ?",
    // TODO Darcy
    answer: null,
  },
  {
    id: "deja-commencee",
    question: "Peut-on financer une formation déjà commencée ?",
    // TODO Darcy
    answer: null,
  },
  {
    id: "avance",
    question: "Faut-il avancer les frais en attendant ?",
    // TODO Darcy — remplacée par SUBROGATION_LINE si le flag subrogation est true
    answer: null,
  },
  {
    id: "cumul-cpf",
    question: "Puis-je cumuler OPCO et CPF pour un salarié ?",
    // TODO Darcy
    answer: null,
  },
];

export function opcoFaq() {
  return FAQ_BASE.map((item) =>
    item.id === "avance" && OPCO_FLAGS.subrogation ? { ...item, answer: SUBROGATION_LINE } : item,
  );
}

export function validatedOpcoFaq() {
  return opcoFaq().filter((item): item is { id: string; question: string; answer: string } => Boolean(item.answer));
}

export function isValidSiret(value: string): boolean {
  if (!/^\d{14}$/.test(value)) return false;
  let sum = 0;
  for (let index = 0; index < 14; index += 1) {
    let digit = Number(value[13 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export const opcoLeadSchema = z.object({
  siret: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s/g, ""))
    .superRefine((value, ctx) => {
      if (!/^\d{14}$/.test(value)) {
        ctx.addIssue({ code: "custom", message: "Indiquez un SIRET de 14 chiffres." });
        return;
      }
      if (!isValidSiret(value)) ctx.addIssue({ code: "custom", message: "Ce SIRET n'est pas valide." });
    }),
  effectif: z.string().refine(
    (value): value is EffectifValue => EFFECTIF_OPTIONS.some((item) => item.value === value),
    "Choisissez un effectif.",
  ),
  formationId: z.string().trim().min(1, "Choisissez une formation.").max(120),
  email: z.string().trim().toLowerCase().email("Indiquez un e-mail professionnel."),
  company_website: z.string().optional(),
});

export function effectifLabel(value: string): string {
  return EFFECTIF_OPTIONS.find((item) => item.value === value)?.label ?? value;
}
