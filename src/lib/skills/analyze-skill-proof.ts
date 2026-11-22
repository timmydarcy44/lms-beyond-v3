import { generateJSON } from "@/lib/ai/openai-client";

export type ProofReviewDecision = "validated" | "refused" | "needs_more";

export type ProofAnalysis = {
  decision: ProofReviewDecision;
  note: string;
  confidence: number;
};

type AnalyzeInput = {
  skillLabel: string;
  rawLabel: string;
  level: string;
  context: string | null;
  proofUrl: string | null;
  proofNote: string | null;
  hasFile: boolean;
  fileName?: string | null;
};

const WEAK_NOTE = /^(je ne sais pas|idk|test|asdf|n\/?a|aucune|rien|ok|oui|non|\.+|xxx)$/i;

/** Heuristique rapide avant LLM (évite de « valider » du bruit). */
export function heuristicProofDecision(input: AnalyzeInput): ProofAnalysis | null {
  const note = String(input.proofNote ?? "").trim();
  const url = String(input.proofUrl ?? "").trim();
  const hasFile = Boolean(input.hasFile);

  if (!note && !url && !hasFile) {
    return {
      decision: "refused",
      note: "Aucune preuve fournie.",
      confidence: 1,
    };
  }

  if (!url && !hasFile && note.length < 40) {
    return {
      decision: "needs_more",
      note: "Une courte note seule ne suffit pas. Ajoute un document, une vidéo ou un lien concret (attestation, livrable, capture…).",
      confidence: 0.9,
    };
  }

  if (!url && !hasFile && WEAK_NOTE.test(note)) {
    return {
      decision: "refused",
      note: "Cette formulation n’est pas une preuve. Dépose un document, une vidéo ou un lien vérifiable.",
      confidence: 0.95,
    };
  }

  return null;
}

export async function analyzeSkillProof(input: AnalyzeInput): Promise<ProofAnalysis> {
  const heuristic = heuristicProofDecision(input);
  if (heuristic) return heuristic;

  const result = await generateJSON(
    `Compétence déclarée : « ${input.skillLabel.replace(/"/g, "'")} »
Formulation apprenant : « ${input.rawLabel.replace(/"/g, "'")} »
Niveau : ${input.level}
Contexte : ${input.context ?? "non précisé"}
Note de preuve : « ${String(input.proofNote ?? "").replace(/"/g, "'")} »
Lien : ${input.proofUrl || "aucun"}
Fichier joint : ${input.hasFile ? input.fileName || "oui" : "non"}

Décide si Byound peut valider cette preuve (hors Open Badge).
- validated : preuve crédible et liée à la compétence
- refused : pas une preuve / hors sujet / frauduleux
- needs_more : piste intéressante mais pièces manquantes

Réponds en JSON : { "decision": "...", "note": "message clair pour l'apprenant (FR)", "confidence": 0.0 }`,
    {
      type: "object",
      properties: {
        decision: { type: "string" },
        note: { type: "string" },
        confidence: { type: "number" },
      },
      required: ["decision", "note", "confidence"],
    },
    `Tu es le contrôle qualité Byound des preuves de compétences.
Sois strict : une note vague sans document/lien ne peut pas être « validated ».
Un PDF, une vidéo, une attestation ou un livrable concret peut être validé.
Si le lien/fichier semble pertinent mais la note est vide, tu peux valider avec prudence ou demander un complément.
Réponds uniquement en JSON.`,
  );

  if (!result || typeof result !== "object") {
    return {
      decision: "needs_more",
      note: "Preuve reçue — analyse automatique incomplète. Un complément (document ou lien) accélérera la validation Byound.",
      confidence: 0.4,
    };
  }

  const raw = String((result as { decision?: string }).decision ?? "").toLowerCase();
  const decision: ProofReviewDecision =
    raw === "validated" || raw === "refused" || raw === "needs_more" ? raw : "needs_more";
  const note =
    String((result as { note?: string }).note ?? "").trim() ||
    (decision === "validated"
      ? "Preuve acceptée par Byound."
      : decision === "refused"
        ? "Preuve refusée."
        : "Pièces complémentaires demandées.");
  const confidence = Math.max(
    0,
    Math.min(1, Number((result as { confidence?: number }).confidence) || 0.5),
  );

  return { decision, note, confidence };
}

export function statusesFromProofDecision(decision: ProofReviewDecision): {
  status: "declared" | "proven";
  proof_review_status: ProofReviewDecision;
} {
  if (decision === "validated") {
    return { status: "proven", proof_review_status: "validated" };
  }
  return { status: "declared", proof_review_status: decision };
}
