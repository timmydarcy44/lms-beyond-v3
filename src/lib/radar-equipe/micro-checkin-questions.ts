export type MicroCheckinQuestion = {
  id: string;
  dimension: string;
  texte: string;
  options: string[];
  scores: number[];
};

export const MICRO_CHECKIN_QUESTIONS: MicroCheckinQuestion[] = [
  {
    id: "stress_charge",
    dimension: "stress",
    texte: "Cette semaine, ma charge de travail me semble :",
    options: ["Légère", "Normale", "Élevée", "Très difficile à gérer"],
    scores: [1, 2, 3, 4],
  },
  {
    id: "idmc_info",
    dimension: "organisation",
    texte: "J'ai eu les informations nécessaires pour travailler sereinement :",
    options: ["Toujours", "Souvent", "Parfois", "Rarement"],
    scores: [4, 3, 2, 1],
  },
  {
    id: "idmc_decision",
    dimension: "decision",
    texte: "J'ai pu prendre des décisions sans être bloqué :",
    options: ["Toujours", "Souvent", "Parfois", "Rarement"],
    scores: [4, 3, 2, 1],
  },
  {
    id: "engagement_sens",
    dimension: "engagement",
    texte: "Mon travail cette semaine avait du sens pour moi :",
    options: ["Tout à fait", "Plutôt oui", "Plutôt non", "Pas du tout"],
    scores: [4, 3, 2, 1],
  },
  {
    id: "comm_equipe",
    dimension: "communication",
    texte: "La communication dans mon équipe cette semaine était :",
    options: ["Fluide", "Correcte", "Tendue", "Difficile"],
    scores: [4, 3, 2, 1],
  },
];

export function getIsoWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getQuestionOfWeek(date = new Date()): MicroCheckinQuestion {
  const week = getIsoWeekId(date);
  const hash = week.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MICRO_CHECKIN_QUESTIONS[hash % MICRO_CHECKIN_QUESTIONS.length];
}
