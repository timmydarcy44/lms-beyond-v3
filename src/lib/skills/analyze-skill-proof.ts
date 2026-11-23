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
  /** Texte extrait du PDF / fichier — obligatoire pour valider un dépôt local. */
  extractedText?: string | null;
};

const WEAK_NOTE = /^(je ne sais pas|idk|test|asdf|n\/?a|aucune|rien|ok|oui|non|\.+|xxx)$/i;
const GIBBERISH =
  /lorem ipsum|dummy text|placeholder|asdfgh|qwerty|test test|n'?importe quoi|foo bar|xxx+|blabla|azerty/i;

/** Confiance mini pour passer en « Prouvée ». */
export const PROOF_VALIDATE_MIN_CONFIDENCE = 0.75;

/** Longueur mini du texte PDF pour qu’on puisse même envisager une validation. */
export const PROOF_PDF_MIN_CHARS = 120;

function skillTokens(label: string): string[] {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

function normalizeHay(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isPdfLike(fileName?: string | null) {
  const name = String(fileName ?? "").toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".txt") || name.endsWith(".md");
}

function contentMentionsSkill(extracted: string, skillLabel: string) {
  const tokens = skillTokens(skillLabel);
  if (!tokens.length) return true;
  const hay = normalizeHay(extracted);
  return tokens.some((token) => hay.includes(token));
}

/**
 * Règle produit PDF / preuve fichier :
 * - un fichier joint ne valide JAMAIS à lui seul ;
 * - un PDF illisible, trop court, hors sujet ou « n’importe quoi » → refused / needs_more ;
 * - « validated » seulement si le CONTENU démontre la compétence (confiance ≥ 0.75).
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

  // PDF / texte joint mais vide ou illisible → jamais validé
  if (hasFile && pdfLike && !extracted) {
    return {
      decision: "needs_more",
      note: "Le PDF a été reçu mais Byound n’a pas pu en lire le contenu. Ajoute une note détaillée (ce que tu as fait, où, pour qui) ou un autre document lisible lié à la compétence.",
      confidence: 0.9,
    };
  }

  if (hasFile && pdfLike && extracted.length > 0 && extracted.length < PROOF_PDF_MIN_CHARS) {
    return {
      decision: "refused",
      note: "Le PDF est trop pauvre pour prouver la compétence. Dépose un livrable concret (travail réalisé, attestation, capture métier…) en lien avec ce que tu déclares.",
      confidence: 0.88,
    };
  }

  if (extracted && GIBBERISH.test(extracted)) {
    return {
      decision: "refused",
      note: "Le document ne contient pas une preuve exploitable (texte factice / hors sujet). Refusé.",
      confidence: 0.95,
    };
  }

  // PDF hors sujet (aucun mot de la compétence) → refus, même avec une note courte
  if (extracted.length >= PROOF_PDF_MIN_CHARS && !contentMentionsSkill(extracted, input.skillLabel)) {
    if (note.length < 120) {
      return {
        decision: "refused",
        note: `Le PDF ne parle pas de « ${input.skillLabel} ». Une compétence n’est prouvée que si le document montre clairement cette compétence.`,
        confidence: 0.9,
      };
    }
    // Note longue : on laisse le LLM trancher, mais pas de validation auto
  }

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

  // Fichier PDF : validation impossible sans texte suffisant + lien sémantique
  if (input.hasFile && pdfLike) {
    if (extracted.length < PROOF_PDF_MIN_CHARS) {
      return {
        decision: "refused",
        note: "Un PDF sans contenu solide ne peut pas valider une compétence.",
      };
    }
    if (!contentMentionsSkill(extracted, input.skillLabel) && note.length < 160) {
      return {
        decision: "refused",
        note: `Le PDF ne démontre pas « ${input.skillLabel} ». Compétence non validée.`,
      };
    }
  }

  // Aucun contenu exploitable du tout
  if (!extracted && !url && note.length < 80) {
    return {
      decision: "needs_more",
      note: "Pas assez d’éléments pour valider. Ajoute un document lisible ou une note détaillée liée à la compétence.",
    };
  }

  if (extracted && GIBBERISH.test(extracted)) {
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
Contenu extrait du fichier :
"""
${excerpt || "(aucun texte extractible — tu ne peux PAS valider sur la seule présence du fichier)"}
"""

Décide :
- validated : UNIQUEMENT si le contenu (extrait PDF / note riche / page) DÉMONTRE concrètement la compétence
- refused : hors sujet, pauvre, absurde, factice, sans rapport, ou PDF « n’importe quoi »
- needs_more : piste possible mais preuve insuffisante

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
Règle d’or : on ne valide JAMAIS une compétence sur un PDF médiocre, hors sujet ou vide de sens.
- La présence d’un fichier n’est PAS une preuve.
- Texte hors sujet / lorem / test / blabla → refused.
- validated seulement si le contenu montre clairement la compétence déclarée (actions, résultats, contexte métier).
- En cas de doute → needs_more ou refused, jamais validated.
Réponds uniquement en JSON.`,
  );

  if (!result || typeof result !== "object") {
    return {
      decision: "needs_more",
      note: "Preuve reçue — analyse automatique incomplète. Un complément (document lisible lié à la compétence) est nécessaire.",
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
        : "Pièces complémentaires demandées.");

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
