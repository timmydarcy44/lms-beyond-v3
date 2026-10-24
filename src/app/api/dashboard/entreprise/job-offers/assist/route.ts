import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/ai/openai-client";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["from_title", "missions"]),
  title: z.string().trim().min(2).max(160),
  contract_type: z.string().trim().max(40).optional(),
  description: z.string().max(12000).optional(),
});

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Indiquez un intitulé." }, { status: 400 });

  const { mode, title, contract_type, description } = parsed.data;
  const prompt = mode === "missions"
    ? `Réécris cette description de poste en une liste de missions, en français, vouvoiement, sans titre markdown.
Poste : ${title}
Contrat : ${contract_type || "non précisé"}
Texte actuel :
${description?.trim() || "(vide — propose 5 missions à partir de l'intitulé)"}
Interdit : âge, sexe, situation familiale, origine, santé. Pas de « jeune », pas de « dynamique ».`
    : `Rédige la description d'un poste en français, vouvoiement, 2 paragraphes courts puis 5 missions commençant par un verbe.
Poste : ${title}
Contrat : ${contract_type || "non précisé"}
Interdit : âge, sexe, situation familiale, origine, santé. Pas de « jeune », pas de « dynamique ». Texte brut, sans markdown.`;

  const text = await generateText(prompt, { maxTokens: 700 });
  if (!text?.trim()) {
    return NextResponse.json({ error: "La rédaction assistée est indisponible pour le moment." }, { status: 503 });
  }
  return NextResponse.json({ text: text.trim() });
}
