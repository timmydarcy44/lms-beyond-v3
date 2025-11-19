/**
 * Génère une question miroir pour détecter les biais cognitifs
 */

export type MirrorQuestionRequest = {
  question: string;
  category?: string;
  type: "single" | "multiple" | "likert" | "scale";
  options?: Array<{ value: string; points?: number }>;
  context?: string;
};

export type MirrorQuestionResponse = {
  mirror_question: string;
  options?: Array<{ value: string; points?: number }>;
  is_positive: boolean;
  confidence: number;
  explanation?: string;
};

/**
 * Génère une question miroir en utilisant l'IA
 */
export async function generateMirrorQuestion(
  request: MirrorQuestionRequest
): Promise<MirrorQuestionResponse> {
  try {
    const response = await fetch("/api/ai/generate-mirror-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la génération de la question miroir");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[generate-mirror-question] Error:", error);
    // Fallback : génération basique sans IA
    return generateBasicMirrorQuestion(request);
  }
}

/**
 * Génère une question miroir basique sans IA (fallback)
 */
function generateBasicMirrorQuestion(
  request: MirrorQuestionRequest
): MirrorQuestionResponse {
  const { question, type, options } = request;

  // Mots-clés à inverser
  const inversions: Record<string, string> = {
    "à l'aise": "mal à l'aise",
    "facilement": "difficilement",
    "souvent": "rarement",
    "toujours": "jamais",
    "bien": "mal",
    "facile": "difficile",
    "préfère": "évite",
    "aime": "n'aime pas",
    "adore": "déteste",
    "excellent": "mauvais",
    "fort": "faible",
    "confiant": "peu confiant",
    "calme": "stressé",
    "organisé": "désorganisé",
  };

  let mirrorQuestion = question;
  let isPositive = true;

  // Détecter si la question est positive ou négative
  const negativeKeywords = ["évite", "difficile", "mal", "jamais", "rarement", "déteste"];
  const hasNegative = negativeKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  if (hasNegative) {
    isPositive = false;
  }

  // Inverser les mots-clés
  for (const [positive, negative] of Object.entries(inversions)) {
    if (mirrorQuestion.toLowerCase().includes(positive)) {
      mirrorQuestion = mirrorQuestion.replace(
        new RegExp(positive, "gi"),
        negative
      );
      isPositive = false;
    } else if (mirrorQuestion.toLowerCase().includes(negative)) {
      mirrorQuestion = mirrorQuestion.replace(
        new RegExp(negative, "gi"),
        positive
      );
      isPositive = true;
    }
  }

  // Si aucune inversion trouvée, ajouter une négation
  if (mirrorQuestion === question) {
    if (question.startsWith("Je ")) {
      mirrorQuestion = question.replace(/^Je /, "Je ne ");
    } else {
      mirrorQuestion = `Je ne ${question.toLowerCase()}`;
    }
  }

  // Inverser les options si c'est un Likert
  let mirrorOptions: Array<{ value: string; points?: number }> | undefined;
  if (type === "likert" && options && options.length > 0) {
    mirrorOptions = [...options].reverse();
  }

  return {
    mirror_question: mirrorQuestion,
    options: mirrorOptions,
    is_positive: !isPositive,
    confidence: 0.7, // Confiance moyenne pour le fallback
    explanation: "Génération basique sans IA",
  };
}





