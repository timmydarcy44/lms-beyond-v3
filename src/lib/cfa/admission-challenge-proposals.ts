import type { CfaSpecialization } from "@/lib/cfa-applications";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";

export type ProposedChallengeQuestion = {
  specialization: CfaSpecialization;
  slug: string;
  label: string;
  prompt: string;
  starter_hint: string;
  sort_order: number;
};

/** 2 questions propres par filière — ton candidature Byound (ouvert, concret, 15–18 ans). */
export const ADMISSION_CHALLENGE_PROPOSALS: ProposedChallengeQuestion[] = [
  // Déjà en prod — conservées pour ré-seed / IA fallback
  {
    specialization: "ai_business",
    slug: "ai_projection",
    label: "Projection",
    prompt:
      "Si tu avais une IA comme collègue commercial pendant une journée, que lui demanderais-tu de faire ?",
    starter_hint: "Je lui demanderais de…",
    sort_order: 1,
  },
  {
    specialization: "ai_business",
    slug: "ai_conviction",
    label: "Conviction",
    prompt:
      "Une PME hésite à utiliser l’IA par peur de mal faire. Comment la convaincrais-tu d’essayer ?",
    starter_hint: "Je lui dirais que…",
    sort_order: 2,
  },
  {
    specialization: "sport_business",
    slug: "sport_curiosity",
    label: "Curiosité business",
    prompt:
      "Un club de foot amateur veut trouver 5 nouveaux partenaires locaux. Par où commencerais-tu ?",
    starter_hint: "Je commencerais par…",
    sort_order: 1,
  },
  {
    specialization: "sport_business",
    slug: "sport_client",
    label: "Compréhension client",
    prompt: "Qu’est-ce qu’un sponsor attend vraiment d’un club, à ton avis ?",
    starter_hint: "À mon avis…",
    sort_order: 2,
  },
  {
    specialization: "retail_experience",
    slug: "retail_observation",
    label: "Observation",
    prompt:
      "Un client entre dans une boutique, fait le tour et ressort sans rien acheter. Qu’est-ce qui a pu se passer ?",
    starter_hint: "Il a peut-être…",
    sort_order: 1,
  },
  {
    specialization: "retail_experience",
    slug: "retail_fidelisation",
    label: "Fidélisation",
    prompt: "Comment donnerais-tu envie à un client de revenir ?",
    starter_hint: "Je ferais…",
    sort_order: 2,
  },

  // Nouvelles filières
  {
    specialization: "real_estate",
    slug: "re_trust",
    label: "Confiance",
    prompt:
      "Une personne visite un appartement et dit « c’est trop cher » sans autre détail. Que ferais-tu ensuite ?",
    starter_hint: "Je lui demanderais…",
    sort_order: 1,
  },
  {
    specialization: "real_estate",
    slug: "re_value",
    label: "Valeur",
    prompt:
      "Comment expliques-tu la différence entre le prix d’un bien et sa valeur pour un acheteur ?",
    starter_hint: "Pour moi, le prix…",
    sort_order: 2,
  },
  {
    specialization: "merchandising",
    slug: "merch_attention",
    label: "Attention",
    prompt:
      "Dans un rayon trop chargé, le client ne regarde plus rien. Que changerais-tu en premier ?",
    starter_hint: "Je commencerais par…",
    sort_order: 1,
  },
  {
    specialization: "merchandising",
    slug: "merch_story",
    label: "Mise en scène",
    prompt:
      "Comment raconterais-tu une histoire de produit sans parler, juste avec le rayon ?",
    starter_hint: "Je mettrais en avant…",
    sort_order: 2,
  },
  {
    specialization: "luxury_premium",
    slug: "lux_detail",
    label: "Exigence",
    prompt:
      "Un client premium remarque un détail qui cloche. Comment réagirais-tu sans casser l’expérience ?",
    starter_hint: "Je…",
    sort_order: 1,
  },
  {
    specialization: "luxury_premium",
    slug: "lux_desire",
    label: "Désir",
    prompt:
      "Qu’est-ce qui, selon toi, transforme un bel objet en quelque chose dont on a vraiment envie ?",
    starter_hint: "Pour moi, c’est…",
    sort_order: 2,
  },
  {
    specialization: "ai_management",
    slug: "aim_priority",
    label: "Priorisation",
    prompt:
      "Ton équipe a 10 idées IA, mais seulement 2 semaines. Comment choisis-tu par quoi commencer ?",
    starter_hint: "Je regarderais d’abord…",
    sort_order: 1,
  },
  {
    specialization: "ai_management",
    slug: "aim_people",
    label: "Équipe",
    prompt:
      "Un collaborateur a peur que l’IA remplace son travail. Comment en parles-tu avec lui ?",
    starter_hint: "Je lui dirais…",
    sort_order: 2,
  },
  {
    specialization: "business_performance",
    slug: "perf_signal",
    label: "Lecture",
    prompt:
      "Les ventes baissent depuis 3 semaines. Quelles 3 infos regarderais-tu en premier ?",
    starter_hint: "Je regarderais…",
    sort_order: 1,
  },
  {
    specialization: "business_performance",
    slug: "perf_action",
    label: "Action",
    prompt:
      "Un indicateur est rouge, mais personne n’est d’accord sur la cause. Que fais-tu concrètement ?",
    starter_hint: "Je…",
    sort_order: 2,
  },
  {
    specialization: "transition_innovation",
    slug: "trans_resistance",
    label: "Changement",
    prompt:
      "Une équipe refuse une nouvelle façon de travailler « parce que ça a toujours marché ». Que fais-tu ?",
    starter_hint: "Je commencerais par…",
    sort_order: 1,
  },
  {
    specialization: "transition_innovation",
    slug: "trans_idea",
    label: "Innovation",
    prompt:
      "Propose une petite innovation (pas un projet géant) qui améliorerait le quotidien d’une entreprise que tu connais.",
    starter_hint: "Je proposerais…",
    sort_order: 2,
  },
  {
    specialization: "growth_acquisition",
    slug: "growth_channel",
    label: "Acquisition",
    prompt:
      "Tu as 200 € pour trouver tes 20 premiers clients. Où les mets-tu, et pourquoi ?",
    starter_hint: "Je les mettrais…",
    sort_order: 1,
  },
  {
    specialization: "growth_acquisition",
    slug: "growth_message",
    label: "Message",
    prompt:
      "Écris en une phrase ce que tu dirais à quelqu’un pour qu’il clique sur « essayer ».",
    starter_hint: "Je dirais…",
    sort_order: 2,
  },
  {
    specialization: "entrepreneurship",
    slug: "entro_problem",
    label: "Problème",
    prompt:
      "Quel problème du quotidien aimerais-tu résoudre avec une petite entreprise, et pour qui ?",
    starter_hint: "Je voudrais aider…",
    sort_order: 1,
  },
  {
    specialization: "entrepreneurship",
    slug: "entro_test",
    label: "Test",
    prompt:
      "Tu as une idée mais pas encore de produit. Comment vérifierais-tu qu’il y a un vrai besoin ?",
    starter_hint: "Je testerais en…",
    sort_order: 2,
  },
  {
    specialization: "international_business",
    slug: "intl_culture",
    label: "Culture",
    prompt:
      "Un partenaire étranger te dit « oui » mais ne donne jamais de suite. Que comprends-tu, et que fais-tu ?",
    starter_hint: "Je me dirais que…",
    sort_order: 1,
  },
  {
    specialization: "international_business",
    slug: "intl_offer",
    label: "Adaptation",
    prompt:
      "Un produit marche en France. Qu’est-ce que tu vérifierais avant de le proposer ailleurs ?",
    starter_hint: "Je vérifierais…",
    sort_order: 2,
  },
  {
    specialization: "strategic_partnerships",
    slug: "part_fit",
    label: "Alliance",
    prompt:
      "Deux marques veulent s’associer. Comment saurais-tu si le partenariat a du sens ?",
    starter_hint: "Je regarderais…",
    sort_order: 1,
  },
  {
    specialization: "strategic_partnerships",
    slug: "part_pitch",
    label: "Proposition",
    prompt:
      "Tu as 2 minutes pour convaincre une entreprise de devenir partenaire. Que dis-tu ?",
    starter_hint: "Je dirais…",
    sort_order: 2,
  },
];

export function proposalsForTrack(track: string): ProposedChallengeQuestion[] {
  return ADMISSION_CHALLENGE_PROPOSALS.filter((q) => q.specialization === track).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
}

export function tracksMissingProposals(existingByTrack: Record<string, number>): string[] {
  return CFA_SPECIALIZATIONS.map((s) => s.value).filter(
    (value) => (existingByTrack[value] ?? 0) < 2,
  );
}
