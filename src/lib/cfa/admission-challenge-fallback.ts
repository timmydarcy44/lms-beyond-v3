import type { ChallengeQuestionRow } from "@/lib/cfa/admission-challenge";
import { ADMISSION_CHALLENGE_PROPOSALS } from "@/lib/cfa/admission-challenge-proposals";

/** Banque locale (miroir du seed SQL) si la DB n’est pas encore migrée. */
const FALLBACK_BANK: Omit<ChallengeQuestionRow, "versionId" | "version">[] = [
  {
    id: "local-common",
    specialization: "common",
    slug: "common_reasoning",
    label: "Raisonnement",
    prompt:
      "Un produit plaît beaucoup mais se vend peu. Quelles seraient les trois premières choses que tu chercherais à comprendre ?",
    starter_hint: "Je commencerais par…",
    sort_order: 0,
    active: true,
  },
  {
    id: "local-ai-1",
    specialization: "ai_business",
    slug: "ai_projection",
    label: "Projection",
    prompt:
      "Si tu avais une IA comme collègue commercial pendant une journée, que lui demanderais-tu de faire ?",
    starter_hint: "Je lui demanderais de…",
    sort_order: 1,
    active: true,
  },
  {
    id: "local-ai-2",
    specialization: "ai_business",
    slug: "ai_conviction",
    label: "Conviction",
    prompt:
      "Une PME hésite à utiliser l’IA par peur de mal faire. Comment la convaincrais-tu d’essayer ?",
    starter_hint: "Je lui dirais que…",
    sort_order: 2,
    active: true,
  },
  {
    id: "local-sport-1",
    specialization: "sport_business",
    slug: "sport_curiosity",
    label: "Curiosité business",
    prompt:
      "Un club de foot amateur veut trouver 5 nouveaux partenaires locaux. Par où commencerais-tu ?",
    starter_hint: "Je commencerais par…",
    sort_order: 1,
    active: true,
  },
  {
    id: "local-sport-2",
    specialization: "sport_business",
    slug: "sport_client",
    label: "Compréhension client",
    prompt: "Qu’est-ce qu’un sponsor attend vraiment d’un club, à ton avis ?",
    starter_hint: "À mon avis…",
    sort_order: 2,
    active: true,
  },
  {
    id: "local-retail-1",
    specialization: "retail_experience",
    slug: "retail_observation",
    label: "Observation",
    prompt:
      "Un client entre dans une boutique, fait le tour et ressort sans rien acheter. Qu’est-ce qui a pu se passer ?",
    starter_hint: "Il a peut-être…",
    sort_order: 1,
    active: true,
  },
  {
    id: "local-retail-2",
    specialization: "retail_experience",
    slug: "retail_fidelisation",
    label: "Fidélisation",
    prompt: "Comment donnerais-tu envie à un client de revenir ?",
    starter_hint: "Je ferais…",
    sort_order: 2,
    active: true,
  },
  {
    id: "local-fb-1",
    specialization: "_fallback",
    slug: "fallback_curiosity",
    label: "Curiosité business",
    prompt:
      "Une entreprise fictive lance un nouveau produit demain. Comment trouverais-tu ses 10 premiers clients ?",
    starter_hint: "Je chercherais d’abord…",
    sort_order: 1,
    active: true,
  },
  {
    id: "local-fb-2",
    specialization: "_fallback",
    slug: "fallback_projection",
    label: "Projection",
    prompt:
      "Si tu avais une journée pour aider une entreprise à mieux vendre, que ferais-tu en premier ?",
    starter_hint: "En premier, je…",
    sort_order: 2,
    active: true,
  },
  ...ADMISSION_CHALLENGE_PROPOSALS.filter(
    (q) => !["ai_business", "sport_business", "retail_experience"].includes(q.specialization),
  ).map((q) => ({
    id: `local-${q.slug}`,
    specialization: q.specialization,
    slug: q.slug,
    label: q.label,
    prompt: q.prompt,
    starter_hint: q.starter_hint,
    sort_order: q.sort_order,
    active: true,
  })),
];

export function getFallbackQuestionsForSpecialization(spec: string): ChallengeQuestionRow[] {
  const track = String(spec || "").trim();
  const common = FALLBACK_BANK.find((q) => q.specialization === "common")!;
  let own = FALLBACK_BANK.filter((q) => q.specialization === track).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  if (own.length < 2) {
    own = FALLBACK_BANK.filter((q) => q.specialization === "_fallback").sort(
      (a, b) => a.sort_order - b.sort_order,
    );
  }
  return [common, ...own].slice(0, 3).map((q) => ({
    ...q,
    versionId: `${q.id}-v1`,
    version: 1,
  }));
}
