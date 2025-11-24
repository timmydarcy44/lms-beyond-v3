import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateTextWithAnthropic } from "@/lib/ai/anthropic-client";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { metadata, type } = body; // type: "description" | "company_presentation"

    if (!metadata || !type) {
      return NextResponse.json({ error: "Métadonnées et type requis" }, { status: 400 });
    }

    let prompt = "";

    if (type === "description") {
      // Générer la description de l'annonce à partir des métadonnées
      prompt = `Tu es un expert en rédaction d'offres d'emploi. Rédige une description d'annonce professionnelle et attractive en français pour le poste suivant :

**Intitulé du poste :** ${metadata.title || "Non spécifié"}
**Type de contrat :** ${metadata.contract_type || "Non spécifié"}
**Lieu :** ${metadata.location || metadata.remote_allowed ? "Télétravail" : "Non spécifié"}
**Nombre d'heures par semaine :** ${metadata.hours_per_week || "Non spécifié"}
**Rémunération :** ${metadata.salary_min && metadata.salary_max ? `${metadata.salary_min} - ${metadata.salary_max} €` : metadata.salary_min ? `À partir de ${metadata.salary_min} €` : metadata.salary_max ? `Jusqu'à ${metadata.salary_max} €` : "Non spécifié"}
**Compétences techniques requises :** ${metadata.required_skills?.join(", ") || "Non spécifié"}
**Soft skills recherchés :** ${metadata.required_soft_skills?.join(", ") || "Non spécifié"}
**Niveau d'expérience :** ${metadata.required_experience || "Non spécifié"}
**Niveau de formation :** ${metadata.required_education || "Non spécifié"}
**Avantages :** ${metadata.benefits?.join(", ") || "Aucun"}

Rédige une description complète et professionnelle qui inclut :
1. Une introduction accrocheuse
2. Les missions principales du poste
3. Les responsabilités
4. Le profil recherché
5. Les avantages et opportunités

La description doit être claire, structurée et attractive pour les candidats. Utilise un ton professionnel mais engageant.`;
    } else if (type === "company_presentation") {
      // Générer la présentation de l'entreprise
      const companyWebsite = metadata.company_website || "";
      
      prompt = `Tu es un expert en communication d'entreprise. Rédige une présentation d'entreprise professionnelle et attractive en français.

${companyWebsite ? `**Site web de l'entreprise :** ${companyWebsite}` : ""}
${metadata.company_name ? `**Nom de l'entreprise :** ${metadata.company_name}` : ""}
${metadata.company_description ? `**Description fournie :** ${metadata.company_description}` : ""}
${metadata.additional_prompt ? `**Instructions supplémentaires :** ${metadata.additional_prompt}` : ""}

Rédige une présentation complète qui inclut :
1. Une introduction sur l'entreprise
2. Le secteur d'activité
3. Les valeurs et la culture d'entreprise
4. La taille et l'organisation
5. Les points forts et avantages de travailler dans cette entreprise

La présentation doit être engageante et donner envie aux candidats de rejoindre l'entreprise. Utilise un ton professionnel mais chaleureux.`;
    } else {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    // Utiliser Anthropic en priorité, OpenAI en fallback
    let result: string | null;

    try {
      result = await generateTextWithAnthropic(prompt, undefined, {
        maxTokens: 2000,
      });

      if (!result) {
        throw new Error("Aucun résultat de Anthropic");
      }
    } catch (anthropicError) {
      console.warn("[beyond-connect/generate-description] Anthropic failed, trying OpenAI:", anthropicError);

      const openai = getOpenAIClient();
      if (!openai) {
        throw new Error("Aucun provider IA disponible");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
      });

      result = response.choices[0]?.message?.content || "Erreur lors de la génération";
    }

    return NextResponse.json({
      result,
      type,
    });
  } catch (error) {
    console.error("[beyond-connect/generate-description] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}


