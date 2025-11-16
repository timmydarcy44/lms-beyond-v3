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
  "content": "Contenu détaillé du chapitre en markdown. Doit comporter au minimum 600 mots et être structuré avec plusieurs sections (##) et sous-sections (###). Chaque section contient : une introduction, des points clés en listes, au moins un exemple concret, des conseils pratiques, et une mini-activité ou question de réflexion.",
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

Le contenu doit être :
- Pédagogique et actionnable
- Structuré avec des sections claires (utilise ## pour les sections principales et ### pour les sous-sections)
- Au minimum 4 sections principales : Introduction, Développement / Concepts clés, Mise en pratique / Études de cas, Synthèse & Plan d'action
- Chaque section doit inclure des listes à puces ou numérotées avec des points concrets, des exemples ou mini-cas, et une recommandation à mettre en œuvre
- Ajouter une section finale "Plan d'action" avec 3 à 5 étapes concrètes à réaliser par l'apprenant
- Utiliser des connecteurs logiques, un ton motivant et professionnel
- Adapter les titres et résumés en casse phrase (pas de Title Case)
- Adapté au contexte de la formation mentionné
- Rédigé en français

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




