export const SCHEMA_PROMPT_VERSION = "timeline-tube-v2";
export const SENTENCE_CASE_PROMPT_VERSION = "sentence-case-v1";

const SENTENCE_CASE_RULE = "N'utilise surtout pas de 'Title Case'. Écris en casse phrase: seule la première lettre d'une phrase ou les noms propres sont en majuscule.";

type RephraseStyle = "simplify" | "enrich" | "formal" | "casual" | "theoretical" | "examples" | "structured";

export function buildRephrasePrompt(text: string, style?: RephraseStyle): string {
  const styleInstructions: Record<RephraseStyle, string> = {
    simplify: "Simplifie le texte pour le rendre plus accessible et facile à comprendre, tout en gardant le sens original.",
    enrich: "Enrichis le texte avec des détails, des exemples et des explications supplémentaires pour approfondir la compréhension.",
    formal: "Réécris le texte dans un style plus formel et académique.",
    casual: "Réécris le texte dans un style plus décontracté et accessible.",
    theoretical: "Réécris le texte en insistant sur les définitions, les concepts clés et les fondements théoriques, avec un ton académique.",
    examples: "Réécris le texte en ajoutant des exemples concrets, des analogies parlantes et des cas d'usage pour illustrer chaque idée.",
    structured: "Réécris le texte de manière très structurée, en étapes ou en listes claires, pour faciliter la mémorisation progressive.",
  };

  const instruction = style ? styleInstructions[style] : "Réécris ce texte pour améliorer sa clarté et sa compréhension.";

  return `${instruction}
${SENTENCE_CASE_RULE}

Texte à transformer :
"${text}"

Réponds uniquement avec le texte reformulé, sans commentaire additionnel.`;
}

export function buildMindMapPrompt(text: string): string {
  return `À partir du texte suivant, génère une carte mentale structurée au format JSON :

"${text}"

Format JSON attendu :
{
  "centralTheme": "Thème central du texte",
  "mainBranches": [
    {
      "label": "Nom de la branche principale",
      "children": [
        {
          "label": "Sous-concept",
          "children": []
        }
      ]
    }
  ]
}

La carte mentale doit :
- Extraire les idées clés
- Organiser les concepts de manière hiérarchique
- Être claire et structurée
- Maximum 3-4 branches principales, 2-3 niveaux de profondeur
- Utiliser des libellés en casse phrase (pas de Title Case)

Réponds uniquement avec le JSON, sans texte additionnel.`;
}

export function buildSchemaPrompt(text: string): string {
  return `À partir du texte suivant, génère un visuel de type "timeline tubulaire" au format JSON :

"${text}"

Format JSON attendu :
{
  "title": "Titre court et impactant",
  "subtitle": "Phrase qui met en contexte la progression",
  "steps": [
    {
      "id": "etape-1",
      "title": "Nom de l'étape",
      "description": "Résumé de 1 à 2 phrases, concret et actionnable",
      "takeaway": "Message clé à retenir",
      "duration": "Durée indicative (optionnel)",
      "icon": "mot-clé pour l'illustration (ex: cible, fusée, ampoule)",
      "color": "Couleur suggérée en hex (optionnel)"
    }
  ],
  "cta": "Phrase finale qui encourage à passer à l'action"
}

Contraintes :
- Propose 4 à 6 étapes maximum.
- Les titres doivent être courts (4 à 6 mots) et dynamiques.
- Les descriptions doivent expliquer ce qui se passe à cette étape.
- La timeline doit refléter une progression logique (début → fin).
- Utilise un vocabulaire positif et motivant.
- Écris chaque titre ou description en casse phrase (évite le Title Case).

Réponds uniquement avec le JSON, sans texte additionnel.`;
}

export function buildTranslatePrompt(text: string, targetLanguage: string): string {
  return `Traduis le texte suivant en ${targetLanguage} :

"${text}"

Instructions :
- Conserve le sens et le ton original
- Adapte le texte à la culture de la langue cible si nécessaire
- Utilise un vocabulaire adapté au contexte pédagogique
- ${SENTENCE_CASE_RULE}

Réponds uniquement avec la traduction, sans commentaire additionnel.`;
}

export function buildAudioPrompt(text: string): string {
  return `À partir du texte suivant, génère un script audio narratif fluide :

"${text}"

Format JSON attendu :
{
  "script": "Texte à lire mot pour mot, naturel et fluide",
  "notes": "Conseils généraux de narration (ton, rythme)",
  "durationEstimate": "Durée estimée en minutes"
}

Le script doit :
- Être écrit pour être lu tel quel, sans annotations techniques
- Éviter toute mention explicite comme "pause", "introduction", "voix off" ou des balises entre crochets
- Introduire naturellement les transitions et respirations avec des phrases fluides
- Rester fidèle au contenu du texte d'origine avec des paragraphes courts
- ${SENTENCE_CASE_RULE}

Les notes peuvent contenir des indications générales (ton chaleureux, rythme posé) mais jamais d'instructions à lire mot pour mot.

Réponds uniquement avec le JSON, sans texte additionnel.`;
}

export function buildInsightsPrompt(text: string): string {
  return `Analyse le texte suivant et extrais des insights pédagogiques :

"${text}"

Format JSON attendu :
{
  "keyConcepts": ["concept1", "concept2"],
  "examples": ["exemple concret 1", "exemple concret 2"],
  "analogies": ["analogie pour faciliter la compréhension"],
  "reviewQuestions": [
    {
      "question": "Question de révision",
      "answer": "Réponse suggérée"
    }
  ],
  "connections": ["Lien avec d'autres concepts", "Application pratique"]
}

Les insights doivent être :
- Actionnables et concrets
- Adaptés à l'apprentissage
- Variés et complémentaires
- Fourni en casse phrase, sans capitaliser chaque mot

Réponds uniquement avec le JSON, sans texte additionnel.`;
}

export function buildDyslexiaPrompt(text: string): string {
  return `Transforme le texte suivant pour améliorer sa lisibilité pour les personnes dyslexiques :

"${text}"

Instructions spécifiques pour la dyslexie :
- Utilise des phrases courtes et claires (maximum 15-20 mots par phrase)
- Évite les mots complexes et les termes techniques non essentiels, ou explique-les simplement
- Structure le texte avec des paragraphes courts et aérés
- Utilise des mots concrets plutôt qu'abstraits quand c'est possible
- Ajoute des connecteurs logiques explicites (donc, car, ensuite, etc.)
- Conserve le sens et les informations importantes du texte original
- Utilise une ponctuation claire pour faciliter la lecture
- Évite les phrases passives complexes
- ${SENTENCE_CASE_RULE}

Réponds uniquement avec le texte transformé, sans commentaire additionnel.`;
}



