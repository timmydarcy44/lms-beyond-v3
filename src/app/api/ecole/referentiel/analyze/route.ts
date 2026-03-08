import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

function extractTextFromPdf(buffer: Buffer): string {
  const text = buffer.toString("latin1");
  const streamMatches = text.match(/stream[\s\S]*?endstream/g) || [];
  const extracted = streamMatches
    .join(" ")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (
    extracted.slice(0, 12000) ||
    text
      .replace(/[^\x20-\x7E\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { pdf_base64?: string; cursus_nom?: string; org_id?: string; user_id?: string }
      | null;
    const pdfBase64 = body?.pdf_base64?.trim();
    const cursusNom = body?.cursus_nom?.trim();
    const orgId = body?.org_id ?? null;
    const userId = body?.user_id ?? null;

    if (!pdfBase64 || !cursusNom) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = Buffer.from(pdfBase64, "base64");
    } catch (error) {
      return NextResponse.json({ error: "PDF invalide" }, { status: 400 });
    }

    const MAX_SIZE = 4 * 1024 * 1024;
    if (pdfBuffer.length > MAX_SIZE) {
      return NextResponse.json({ error: "PDF trop lourd (max 4MB)" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
    }

    const pdfText = extractTextFromPdf(pdfBuffer);

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en ingénierie pédagogique et en 
formation professionnelle par alternance.

À partir du référentiel de formation ci-dessous,
génère exactement 10 missions professionnelles 
concrètes que l'entreprise devra confier à l'alternant
tout au long de son contrat.

Chaque mission doit :
- Être réalisable en entreprise (pas en école)
- Être progressive (du plus simple au plus complexe)
- Avoir un titre clair et actionnable
- Avoir une description détaillée de ce que l'alternant
  doit faire concrètement
- Avoir un exemple concret de livrable attendu
- Avoir une durée estimée réaliste

Retourne UNIQUEMENT ce JSON valide :
{
  'missions': [
    {
      'titre': string,
      'description': string,
      'exemple': string,
      'duree_estimee': string,
      'niveau': 'debutant' | 'intermediaire' | 'avance'
    }
  ]
}

Génère exactement 10 missions, ni plus ni moins.`,
        },
        {
          role: "user",
          content: pdfText,
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content || "";
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossible d'extraire le JSON" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: referentiel } = await supabase
      .from("tutor_referentiels")
      .insert({
        titre: cursusNom,
        org_id: orgId || null,
        created_by: userId || null,
        fichier_url: null,
      })
      .select()
      .single();

    if (referentiel && Array.isArray(parsed.missions)) {
      await supabase.from("tutor_missions").insert(
        parsed.missions.map((mission: any) => ({
          tutor_id: null,
          learner_id: null,
          org_id: orgId || null,
          title: mission.titre,
          description: mission.description,
          statut: "EN_ATTENTE",
          referentiel_source: referentiel.id,
        }))
      );
    }

    return NextResponse.json({
      ...parsed,
      referentiel_id: referentiel?.id,
    });
  } catch (error) {
    console.error("[api/ecole/referentiel/analyze] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
