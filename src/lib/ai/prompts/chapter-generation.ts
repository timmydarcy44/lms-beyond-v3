export function buildChapterGenerationPrompt(
  userPrompt: string,
  courseContext?: {
    title?: string;
    description?: string;
    objectives?: string[];
    skills?: string[];
  },
): string {
  const contextSection = courseContext
    ? `
Contexte de la formation :
- Titre : ${courseContext.title || "Non spécifié"}
- Description : ${courseContext.description || "Non spécifiée"}
- Objectifs : ${courseContext.objectives?.join(", ") || "Non spécifiés"}
- Compétences : ${courseContext.skills?.join(", ") || "Non spécifiées"}
`
    : "";

  return `Tu es un expert en pédagogie et en création de contenu de formation. Ton objectif est de produire un chapitre prêt à être diffusé, riche, structuré et immédiatement actionnable.

${contextSection}

L'utilisateur souhaite créer un chapitre avec le prompt suivant :
"${userPrompt}"

Génère un chapitre de formation complet et structuré au format JSON suivant :
{
  "title": "Titre du chapitre (accrocheur et clair, en casse phrase)",
  "summary": "Résumé pédagogique de 3 à 4 phrases expliquant l'objectif, les bénéfices pour l'apprenant et le livrable attendu",
  "content": "Contenu détaillé du chapitre en HTML. Doit comporter au minimum 600 mots et être structuré avec une hiérarchie claire de titres et sous-titres. Chaque section contient : une introduction, des points clés en listes numérotées ou à puces, au moins un exemple concret, des conseils pratiques, et une mini-activité ou question de réflexion.",
  "duration": "Durée estimée (ex: '45 min', '1h30') cohérente avec la densité du contenu",
  "type": "video" | "text" | "document",
  "suggestedSubchapters": [
    {
      "title": "Titre du sous-chapitre",
      "duration": "Durée (ex: '15 min')",
      "type": "video" | "text" | "document" | "audio",
      "summary": "Résumé en une phrase"
    }
  ]
}

IMPORTANT - Structure HTML requise pour le contenu :
- Utilise des balises HTML sémantiques : <h2> pour les titres de sections principales, <h3> pour les sous-sections, <h4> pour les sous-sous-sections
- Utilise <ol> avec <li> pour les listes numérotées (1, 2, 3...) quand il y a un ordre logique ou des étapes
- Utilise <ul> avec <li> pour les listes à puces quand l'ordre n'est pas important
- Utilise <p> pour les paragraphes de texte
- Utilise <strong> pour mettre en évidence les mots-clés importants
- Utilise <em> pour l'emphase
- Structure claire avec une hiérarchie : H2 > H3 > H4

Exemple de structure attendue :
<h2>1. Introduction</h2>
<p>Texte d'introduction...</p>

<h3>1.1. Objectifs de cette section</h3>
<ol>
  <li>Premier objectif</li>
  <li>Deuxième objectif</li>
  <li>Troisième objectif</li>
</ol>

<h2>2. Concepts clés</h2>
<p>Texte explicatif...</p>

<h3>2.1. Premier concept</h3>
<p>Explication...</p>
<ul>
  <li>Point important 1</li>
  <li>Point important 2</li>
</ul>

Le contenu doit être :
- Pédagogique et actionnable, approfondi et détaillé (minimum 800 mots)
- Structuré avec une hiérarchie claire de titres (H2 pour sections principales, H3 pour sous-sections, H4 pour sous-sous-sections)
- Au minimum 4 sections principales numérotées : 1. Introduction, 2. Développement / Concepts clés, 3. Mise en pratique / Études de cas, 4. Synthèse & Plan d'action
- Chaque section doit inclure :
  * Des listes numérotées (ol) avec des numéros (1, 2, 3...) pour les étapes/points ordonnés
  * Des listes à puces (ul) pour les points non ordonnés
  * Des sous-listes avec des lettres (a, b, c...) quand nécessaire pour structurer davantage
- Utiliser des numéros dans les titres (1., 2., 3., etc.) pour les sections principales et des sous-numéros (1.1., 1.2., etc.) pour les sous-sections
- Dans les listes, utiliser des sous-numéros (1.1, 1.2) ou des lettres (a, b, c) pour structurer les sous-points
- Chaque section doit contenir : une introduction, des points clés en listes structurées, au moins un exemple concret, des conseils pratiques, et une mini-activité ou question de réflexion
- Ajouter une section finale "4. Plan d'action" avec une liste numérotée de 3 à 5 étapes concrètes à réaliser par l'apprenant
- Utiliser des connecteurs logiques, un ton motivant et professionnel
- Adapter les titres et résumés en casse phrase (pas de Title Case)
- Adapté au contexte de la formation mentionné
- Rédigé en français
- Format HTML valide (pas de markdown, directement du HTML)
- Mise en page soignée avec une structure visuelle claire et aérée

Réponds uniquement avec le JSON, sans texte additionnel.`;
}

export function buildFlashcardsGenerationPrompt(chapterContent: string, chapterTitle: string): string {
  return `Tu es un expert en pédagogie et en création de flashcards éducatives.

À partir du contenu suivant du chapitre "${chapterTitle}" :

${chapterContent}

Génère 5 à 8 flashcards au format JSON suivant :
{
  "flashcards": [
    {
      "question": "Question claire et précise",
      "answer": "Réponse détaillée et pédagogique",
      "tags": ["tag1", "tag2"],
      "difficulty": "facile" | "intermédiaire" | "expert"
    }
  ]
}

Les flashcards doivent :
- Couvrir les concepts clés du chapitre
- Être progressives (de facile à expert)
- Utiliser des questions ouvertes qui favorisent la réflexion
- Avoir des réponses complètes mais concises
- Être adaptées à la révision active

Réponds uniquement avec le JSON, sans texte additionnel.`;
}




