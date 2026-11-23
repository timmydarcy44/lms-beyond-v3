import { generateJSON } from "@/lib/ai/openai-client";
import { PROOF_PDF_UNREADABLE_MAX_CHARS } from "@/lib/skills/extract-proof-pdf";

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
  /** Texte extrait du PDF / fichier. */
  extractedText?: string | null;
};

const WEAK_NOTE = /^(je ne sais pas|idk|test|asdf|n\/?a|aucune|rien|ok|oui|non|\.+|xxx)$/i;
const GIBBERISH =
  /lorem ipsum|dummy text|placeholder|asdfgh|qwerty|test test|n'?importe quoi|foo bar|xxx+|blabla|azerty/i;

/** Confiance mini pour passer en « Prouvée ». */
export const PROOF_VALIDATE_MIN_CONFIDENCE = 0.75;

function isPdfLike(fileName?: string | null) {
  const name = String(fileName ?? "").toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".txt") || name.endsWith(".md");
}

/**
 * Règles produit :
 * - jamais de validation auto sur présence de fichier ;
 * - PDF illisible seulement si < 30 caractères extractibles ;
 * - texte lisible → tri IA (pertinence), pas de short-circuit « hors sujet » avant l’IA.
 */
export function heuristicProofDecision(input: AnalyzeInput): ProofAnalysis | null {
  const note = String(input.proofNote ?? "").trim();
  const url = String(input.proofUrl ?? "").trim();
  const hasFile = Boolean(input.hasFile);
  const extracted = String(input.extractedText ?? "").trim();
  const pdfLike = isPdfLike(input.fileName);

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

  // Illisible = scan / image / extraction vide — seuil 30 caractères
  if (hasFile && pdfLike && extracted.length < PROOF_PDF_UNREADABLE_MAX_CHARS) {
    return {
      decision: "needs_more",
      note: "Le PDF a été reçu mais Byound n’a pas pu en lire le contenu (fichier scanné ou image). Ajoute une note détaillée ou un document texte lié à la compétence.",
      confidence: 0.9,
    };
  }

  if (extracted && GIBBERISH.test(extracted) && extracted.length < 80) {
    return {
      decision: "refused",
      note: "Le document ne contient pas une preuve exploitable (texte factice). Refusé.",
      confidence: 0.95,
    };
  }

  // Texte lisible → toujours laisser l’IA trancher (jamais de validation ici)
  return null;
}

/** Garde-fou final : empêche toute validation « cheap » après le LLM. */
export function enforceProofValidationGate(
  decision: ProofReviewDecision,
  input: AnalyzeInput,
  confidence: number,
): { decision: ProofReviewDecision; note?: string } {
  if (decision !== "validated") return { decision };

  const note = String(input.proofNote ?? "").trim();
  const url = String(input.proofUrl ?? "").trim();
  const extracted = String(input.extractedText ?? "").trim();
  const pdfLike = isPdfLike(input.fileName);

  if (confidence < PROOF_VALIDATE_MIN_CONFIDENCE) {
    return {
      decision: "needs_more",
      note: "Byound n’est pas assez sûr pour valider. Ajoute une preuve plus concrète et liée à la compétence.",
    };
  }

  if (input.hasFile && pdfLike && extracted.length < PROOF_PDF_UNREADABLE_MAX_CHARS) {
    return {
      decision: "needs_more",
      note: "Un PDF illisible ne peut pas valider une compétence.",
    };
  }

  if (!extracted && !url && note.length < 80) {
    return {
      decision: "needs_more",
      note: "Pas assez d’éléments pour valider. Ajoute un document lisible ou une note détaillée liée à la compétence.",
    };
  }

  if (extracted && GIBBERISH.test(extracted) && extracted.length < 80) {
    return {
      decision: "refused",
      note: "Document non recevable (contenu factice). Compétence non validée.",
    };
  }

  return { decision };
}

export async function analyzeSkillProof(input: AnalyzeInput): Promise<ProofAnalysis> {
  const heuristic = heuristicProofDecision(input);
  if (heuristic) return heuristic;

  const excerpt = String(input.extractedText ?? "").trim().slice(0, 6000);

  const result = await generateJSON(
    `Compétence déclarée : « ${input.skillLabel.replace(/"/g, "'")} »
Formulation apprenant : « ${input.rawLabel.replace(/"/g, "'")} »
Niveau : ${input.level}
Contexte : ${input.context ?? "non précisé"}
Note de preuve : « ${String(input.proofNote ?? "").replace(/"/g, "'")} »
Lien : ${input.proofUrl || "aucun"}
Fichier joint : ${input.hasFile ? input.fileName || "oui" : "non"}
Contenu extrait du fichier (LU — à juger sur le fond) :
"""
${excerpt || "(aucun texte extractible — tu ne peux PAS valider sur la seule présence du fichier)"}
"""

Décide :
- validated : UNIQUEMENT si le contenu DÉMONTRE concrètement la compétence avec des faits vérifiables
  (ex. immobilier / prise de mandat : quel bien, quelle date, quel type de mandat, quel résultat)
- refused : hors sujet, absurde, factice, sans rapport
- needs_more : le texte parle de la compétence mais reste trop générique / scolaire / sans exemple concret
  → demande explicitement les faits manquants (bien, date, type de mandat, résultat, etc.)

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
Règle d’or : on ne valide JAMAIS sur un PDF médiocre, générique ou vide de faits.
- La présence d’un fichier n’est PAS une preuve.
- Un discours générique (« j’ai appris à… », « il faut être professionnel ») sans exemple concret → needs_more
  (demande : quel bien / quelle date / quel type de mandat / quel résultat, adaptés à la compétence).
- Hors sujet / factice → refused.
- validated seulement si le contenu montre clairement la compétence avec des éléments concrets.
- En cas de doute → needs_more ou refused, jamais validated.
Réponds uniquement en JSON.`,
  );

  if (!result || typeof result !== "object") {
    return {
      decision: "needs_more",
      note: "Preuve reçue — analyse automatique incomplète. Précise un exemple concret (faits, dates, résultat).",
      confidence: 0.35,
    };
  }

  const raw = String((result as { decision?: string }).decision ?? "").toLowerCase();
  let decision: ProofReviewDecision =
    raw === "validated" || raw === "refused" || raw === "needs_more" ? raw : "needs_more";
  let confidence = Math.max(
    0,
    Math.min(1, Number((result as { confidence?: number }).confidence) || 0.5),
  );
  let message =
    String((result as { note?: string }).note ?? "").trim() ||
    (decision === "validated"
      ? "Preuve acceptée par Byound."
      : decision === "refused"
        ? "Preuve refusée : le contenu ne démontre pas la compétence."
        : "Pièces complémentaires demandées : donne un exemple concret.");

  const gated = enforceProofValidationGate(decision, input, confidence);
  if (gated.decision !== decision) {
    decision = gated.decision;
    if (gated.note) message = gated.note;
    confidence = Math.min(confidence, decision === "refused" ? 0.9 : 0.55);
  }

  return { decision, note: message, confidence };
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
