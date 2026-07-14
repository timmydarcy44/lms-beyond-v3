import { generateText } from "@/lib/ai/openai-client";
import { computeDealIntelligence, type DealIntelligenceInput } from "@/lib/crm/pipeline-deal-intelligence";

export type DealActionRow = {
  id: string;
  action_type: string;
  title?: string | null;
  notes?: string | null;
  transcript?: string | null;
  ai_summary?: string | null;
  created_at: string;
  created_by_email?: string | null;
};

export async function synthesizeCallFromTranscript(input: {
  companyName: string;
  contactName: string;
  actionType: string;
  transcript: string;
  manualNotes?: string;
}): Promise<string | null> {
  const prompt = `Tu es l'assistant commercial EDGE (formation B2B). Synthétise cet appel téléphonique en français, ton professionnel et actionnable.

Entreprise : ${input.companyName}
Contact : ${input.contactName}
Type d'appel : ${input.actionType}

Transcription / notes :
${input.transcript}
${input.manualNotes ? `\nNotes complémentaires : ${input.manualNotes}` : ""}

Structure la synthèse ainsi :
1. **Contexte** (1 phrase)
2. **Points clés** (puces)
3. **Objections / freins** (si mentionnés)
4. **Signaux d'achat** (si mentionnés)
5. **Prochaine étape recommandée** (1 action concrète)

Reste factuel. Maximum 250 mots.`;

  return generateText(prompt, { model: "gpt-4o-mini", maxTokens: 900 });
}

export async function synthesizeCallFromNotes(input: {
  companyName: string;
  contactName: string;
  actionType: string;
  notes: string;
}): Promise<string | null> {
  return synthesizeCallFromTranscript({
    ...input,
    transcript: input.notes,
  });
}

export async function synthesizeProspectOverview(input: {
  deal: DealIntelligenceInput & { id?: string; stage_slug: string; notes?: string | null };
  actions: DealActionRow[];
  existingSummary?: string | null;
}): Promise<string | null> {
  const intel = computeDealIntelligence(input.deal);
  const actionsBlock =
    input.actions.length === 0
      ? "Aucune action enregistrée."
      : input.actions
          .slice(0, 20)
          .map(
            (a) =>
              `- [${a.created_at.slice(0, 10)}] ${a.action_type}${a.ai_summary ? ` — ${a.ai_summary.slice(0, 400)}` : a.notes ? ` — ${a.notes.slice(0, 200)}` : ""}`,
          )
          .join("\n");

  const prompt = `Tu es le coach commercial IA EDGE. Rédige une synthèse globale du prospect en français.

## Entreprise
${input.deal.company_name} — contact : ${input.deal.contact_first_name}
Étape pipeline : ${input.deal.stage_slug}
${input.deal.notes ? `Notes : ${input.deal.notes}` : ""}

## Scores EDGE
Health Score : ${intel.healthScore}/100 — Probabilité signature : ${intel.signatureProbability}%
Relationship Score : ${intel.relationshipScore}%
Complétude dossier : ${intel.completenessScore}%
Prochaine meilleure action : ${intel.nextBestAction}

## Historique actions
${actionsBlock}

${input.existingSummary ? `Synthèse précédente :\n${input.existingSummary}\n` : ""}

Rédige :
1. **Situation actuelle** (3-4 phrases)
2. **Ce qui a été fait** (puces)
3. **Ce qu'il reste à faire** (puces priorisées)
4. **Risques & opportunités**
5. **Recommandation EDGE** (1 paragraphe)

Ton direct, utile pour Jérôme ou Timmy. Maximum 400 mots.`;

  return generateText(prompt, { model: "gpt-4o-mini", maxTokens: 1200 });
}
