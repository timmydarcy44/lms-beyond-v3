export const SCHEMA_PROMPT_VERSION = "schema-kinds-v1";

export const SCHEMA_KINDS = ["timeline", "flow", "cycle", "pyramid", "compare"] as const;
export type SchemaKind = (typeof SCHEMA_KINDS)[number];

export function normalizeSchemaKind(value: unknown): SchemaKind {
  return SCHEMA_KINDS.includes(value as SchemaKind) ? (value as SchemaKind) : "timeline";
}
export const SENTENCE_CASE_PROMPT_VERSION = "sentence-case-v1";

const SENTENCE_CASE_RULE = "N'utilise surtout pas de 'Title Case'. Écris en casse phrase: seule la première lettre d'une phrase ou les noms propres sont en majuscule.";

const MARKDOWN_STRUCTURE_RULE = `Structure ta réponse en Markdown lisible :
- Utilise ## pour les titres de sections (ex. "## Introduction", "## Définition : …", "## Exemple concret : …").
- Utilise ### pour les sous-parties si nécessaire.
- Paragraphes séparés par une ligne vide.
- Listes à puces avec "- " pour les étapes ou éléments courts.
- Mets en **gras** les notions importantes (avec parcimonie).
Pas de balises HTML. Pas de préambule ("Voici…").`;

type RephraseStyle =
  | "simplify"
  | "enrich"
  | "formal"
  | "casual"
  | "theoretical"
  | "examples"
  | "structured"
  | "scenario"
  | "child";

export function buildRephrasePrompt(text: string, style?: RephraseStyle): string {
  const styleInstructions: Record<RephraseStyle, string> = {
    simplify: "Simplifie le texte pour le rendre plus accessible et facile à comprendre, tout en gardant le sens original.",
    enrich: "Enrichis le texte avec des détails, des exemples et des explications supplémentaires pour approfondir la compréhension.",
    formal: "Réécris le texte dans un style plus formel et académique.",
    casual: "Réécris le texte dans un style plus décontracté et accessible.",
    theoretical: "Réécris le texte en insistant sur les définitions, les concepts clés et les fondements théoriques, avec un ton académique.",
    examples: "Réécris le texte en ajoutant des exemples concrets, des analogies parlantes et des cas d'usage pour illustrer chaque idée.",
    structured: "Réécris le texte de manière très structurée, en étapes ou en listes claires, pour faciliter la mémorisation progressive.",
    scenario: "Réécris le texte sous forme de mise en situation concrète, avec un scénario simple pour rendre les idées plus vivantes.",
    child: "Explique le texte comme si tu parlais à un enfant de 5 ans, avec des phrases très simples et un vocabulaire accessible.",
  };

  const instruction = style ? styleInstructions[style] : "Réécris ce texte pour améliorer sa clarté et sa compréhension.";

  return `${instruction}
${SENTENCE_CASE_RULE}

${MARKDOWN_STRUCTURE_RULE}

Texte à transformer :
"${text}"

Réponds uniquement avec le Markdown reformulé, sans commentaire hors contenu.`;
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

export function buildSchemaPrompt(text: string, kind: unknown = "timeline"): string {
  const schemaKind = normalizeSchemaKind(kind);
  const shared = `À partir du texte suivant, construis un schéma de type "${schemaKind}". Le dessin doit suivre le texte : interdiction de recycler un plan générique en quatre étapes identiques d'un texte à l'autre.

"${text}"

Règles communes :
- "kind" vaut exactement "${schemaKind}".
- Français, casse phrase, pas de Title Case.
- Titres courts (4 à 6 mots). Descriptions concrètes, tirées du texte.
- Réponds uniquement avec le JSON, sans texte additionnel.`;

  if (schemaKind === "compare") {
    return `${shared}

JSON attendu :
{
  "kind": "compare",
  "title": "Ce que le texte oppose ou rapproche",
  "subtitle": "Une phrase de contexte",
  "left": { "title": "Premier pôle", "points": ["fait tiré du texte", "autre fait"] },
  "right": { "title": "Second pôle", "points": ["fait tiré du texte", "autre fait"] },
  "cta": "Phrase de synthèse"
}

3 à 5 points par colonne. Les deux pôles doivent être réellement distincts dans le texte.`;
  }

  const shape =
    schemaKind === "flow"
      ? "Enchaîne des actions dans l'ordre où on les fait. Chaque étape commence par un verbe. 4 à 6 étapes."
      : schemaKind === "cycle"
        ? "Boucle fermée : la dernière étape ramène à la première. 4 ou 5 étapes, pas une liste linéaire déguisée."
        : schemaKind === "pyramid"
          ? "Empile du plus large (la base, l'idée générale) au plus étroit (le sommet, l'essentiel). 4 niveaux exactement, du bas vers le haut dans le tableau steps."
          : "Frise dans le temps ou dans une progression début → fin. 4 à 6 étapes, chacune avec un repère de durée si le texte en donne un.";

  return `${shared}

${shape}

JSON attendu :
{
  "kind": "${schemaKind}",
  "title": "Titre court",
  "subtitle": "Phrase de contexte",
  "steps": [
    {
      "id": "etape-1",
      "title": "Nom de l'étape",
      "description": "1 à 2 phrases tirées du texte",
      "takeaway": "À retenir",
      "duration": "optionnel",
      "icon": "mot court"
    }
  ],
  "cta": "Phrase finale"
}`;
}

export function buildRevisionSheetPrompt(text: string): string {
  return buildSynthesisSheetPrompt(text);
}

/** Fiche synthétique : résumé, définitions, schémas (Mermaid), points clés — format Markdown. */
export function buildSynthesisSheetPrompt(text: string): string {
  return `Tu es un concepteur pédagogique. À partir du texte ci-dessous, rédige une **fiche synthétique** complète pour réviser et comprendre le sujet.

${SENTENCE_CASE_RULE}

${MARKDOWN_STRUCTURE_RULE}

Structure obligatoire (dans cet ordre, avec les titres exacts en ##) :

## Synthèse
- 1 paragraphe d’introduction (5–8 lignes) qui résume l’essentiel.
- 3 à 6 puces « à retenir absolument ».

## Définitions clés
Pour chaque notion importante (4 à 8 max) :
### [Nom de la notion]
- **Définition** : formulation claire en 1–3 phrases.
- **Pourquoi c’est important** : une phrase.
- **Exemple** : cas concret court.

## Schémas et relations
- Explique les liens entre les concepts en prose (2–4 phrases).
- Ajoute **un schéma Mermaid** (bloc \`\`\`mermaid) : flowchart TD ou mindmap selon ce qui convient le mieux (6 nœuds max, libellés courts en français).

## Mise en pratique
- 2 à 4 actions ou conseils applicables.

## Questions de révision
- 4 à 6 questions avec réponses courtes (format : **Q :** … **R :** …).

Contraintes :
- Fidélité au texte source : ne pas inventer de faits absents du passage.
- Ton pédagogique, français, accessible.
- Pas de préambule (« voici la fiche… »).
- Longueur cible : environ 600–1200 mots selon la richesse du texte.

Texte source :
"${text}"

Réponds uniquement avec le Markdown de la fiche.`;
}

export function buildTranslatePrompt(text: string, targetLanguage: string): string {
  return `Traduis le texte suivant en ${targetLanguage} :

"${text}"

Instructions :
- Conserve le sens et le ton original
- Adapte le texte à la culture de la langue cible si nécessaire
- Utilise un vocabulaire adapté au contexte pédagogique
- ${SENTENCE_CASE_RULE}

${MARKDOWN_STRUCTURE_RULE}

Réponds uniquement avec la traduction en Markdown, sans commentaire hors contenu.`;
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
  return `Extrais les mots-clés du texte suivant :

"${text}"

Format JSON attendu :
{
  "keywords": ["mot-clé", "autre mot-clé"],
  "keyConcepts": ["mot-clé", "autre mot-clé"]
}

Règles :
- Produis 8 à 14 mots-clés
- Chaque mot-clé fait un à quatre mots, sans phrase ni définition
- keywords et keyConcepts contiennent la même liste
- ${SENTENCE_CASE_RULE}

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



