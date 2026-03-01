import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
    const {
      company_name,
      job_title,
      city,
      contract_type,
      remote_type,
      remuneration,
      missions_input,
      naf_code,
    } = body ?? {};

    if (!company_name || !job_title || !missions_input) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const system = `CONTEXTE : Tu es un expert en recrutement pour les écoles spécialisées en alternance.
CONSIGNES DE RÉDACTION :
1. Rédige une offre attractive et moderne.
2. Structure : Présentation entreprise, Tes missions, Ton profil, Pourquoi nous rejoindre.
3. Ton : Professionnel mais dynamique.
4. Format de sortie : Uniquement du Markdown, sans aucun commentaire technique.`;

    const user = `DONNÉES À INJECTER :
- Entreprise : ${company_name}
- Poste : ${job_title}
- Ville : ${city || "Non précisée"}
- Contrat : ${contract_type || "Alternance"}
- Travail : ${remote_type || "Hybride"}
- Salaire : ${remuneration || "Non précisé"}
- Missions brutes : ${missions_input}
- Code NAF : ${naf_code || "Non précisé"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 700,
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    if (!content) {
      return NextResponse.json({ error: "Réponse IA vide." }, { status: 502 });
    }

    return NextResponse.json({ markdown: content });
  } catch (error) {
    console.error("[generate-job-offer] Error:", error);
    console.error("[generate-job-offer] Payload reçu:", Object.keys(body || {}));
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
