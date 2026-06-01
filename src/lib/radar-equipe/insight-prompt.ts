import type { IdmcZone, StressSignal } from "@/lib/radar-equipe/constants";

export function buildRadarInsightPrompt(params: {
  idmcMoyen: number;
  idmcZone: IdmcZone;
  stressMoyen: number;
  stressSignal: StressSignal;
  discDominant: string;
  discManquant: string | null;
  gapsFrequents: string[];
  nbSignauxAttention: number;
  nbSignauxCritique: number;
}): string {
  return `Tu es l'assistant RH de Beyond. Génère UNE phrase d'insight actionnable pour un manager, basée sur ces données ANONYMISÉES de son équipe.

Données :
- IDMC moyen : ${params.idmcMoyen}/100 (zone : ${params.idmcZone})
- Stress moyen : ${params.stressMoyen}/100 (${params.stressSignal})
- Profil DISC dominant : ${params.discDominant}
- Profil DISC sous-représenté : ${params.discManquant ?? "aucun signal"}
- Gaps collectifs fréquents : ${params.gapsFrequents.join(", ") || "aucun"}
- Signaux d'attention : ${params.nbSignauxAttention}
- Signaux critiques : ${params.nbSignauxCritique}

Règles :
- Jamais de nom ou d'identification individuelle
- Phrase courte, actionnable, en français
- Ton manager direct, pas consultant
- Réponds uniquement avec la phrase, sans guillemets ni markdown`;
}
