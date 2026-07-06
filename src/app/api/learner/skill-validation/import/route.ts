import { NextRequest, NextResponse } from "next/server";
import { extractTextWithVision } from "@/lib/ai/openai-client";
import {
  analyzeSkillValidation,
  buildFallbackSkillAnalysis,
} from "@/lib/hard-skills/skill-validation-analyze";
import { parseSkillAnalysisApiResult } from "@/lib/hard-skills/skill-validation-analysis";
import { sendSkillValidationEmails } from "@/lib/hard-skills/send-skill-validation-emails";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const TEXT_MIME = new Set([
  "text/plain",
  "text/csv",
  "application/json",
  "text/markdown",
]);

async function extractProofContent(file: File | null, proofNote: string): Promise<string> {
  let documentExcerpt = proofNote.trim();

  if (!file || file.size === 0) return documentExcerpt;

  if (file.size < 500_000 && (TEXT_MIME.has(file.type) || file.name.endsWith(".txt"))) {
    const text = await file.text().catch(() => "");
    if (text) documentExcerpt = [documentExcerpt, text.slice(0, 4000)].filter(Boolean).join("\n\n");
    return documentExcerpt;
  }

  const isVision =
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.name.match(/\.(png|jpe?g|webp|pdf)$/i);

  if (isVision && file.size < 8_000_000) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    const visionText = await extractTextWithVision(buffer, mime);
    if (visionText) {
      documentExcerpt = [documentExcerpt, visionText.slice(0, 4000)].filter(Boolean).join("\n\n");
    }
  }

  if (!documentExcerpt && file.name) {
    documentExcerpt = `Fichier fourni : ${file.name} (${file.type || "format binaire"})`;
  }

  return documentExcerpt;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const formData = await request.formData();
    const skillName = String(formData.get("skillName") ?? "").trim();
    const level = String(formData.get("level") ?? "Intermédiaire") as HardSkillLevel;
    const proofUrl = String(formData.get("proofUrl") ?? "").trim();
    const proofNote = String(formData.get("proofNote") ?? "").trim();
    const file = formData.get("file") as File | null;

    if (!skillName) return NextResponse.json({ error: "Compétence requise" }, { status: 400 });

    const documentExcerpt = await extractProofContent(file, proofNote);

    const prompt = `Analyse cette preuve de compétence pour "${skillName}" (niveau déclaré : ${level}).
Lien : ${proofUrl || "—"}
Contenu / description :
${documentExcerpt || "—"}`;

    const { result, source } = await analyzeSkillValidation({
      skillName,
      level,
      prompt,
      fallback: () =>
        buildFallbackSkillAnalysis({
          skillName,
          level,
          mode: "proof",
          proofNote: documentExcerpt,
          proofUrl,
        }),
    });

    const parsed = parseSkillAnalysisApiResult(result as Record<string, unknown>, level);

    const service = getServiceRoleClient();
    const profileRes = await (service ?? supabase)
      .from("profiles")
      .select("first_name, email")
      .eq("id", userData.user.id)
      .maybeSingle();

    await sendSkillValidationEmails({
      firstName: String(profileRes.data?.first_name ?? ""),
      email: String(profileRes.data?.email ?? userData.user.email ?? ""),
      skillName,
      verdict: parsed.verdict,
      sendProofReceived: true,
    }).catch((err) => console.error("[skill-validation/import] email:", err));

    return NextResponse.json({ ...parsed, analysisSource: source });
  } catch (error) {
    console.error("[skill-validation/import]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
