import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { sendSkillValidationEmails } from "@/lib/hard-skills/send-skill-validation-emails";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

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

    let documentExcerpt = proofNote;
    if (file && file.size > 0 && file.size < 500_000) {
      const text = await file.text().catch(() => "");
      if (text) documentExcerpt = text.slice(0, 4000);
    }

    const prompt = `Analyse cette preuve de compétence pour "${skillName}" (niveau déclaré : ${level}).
Lien : ${proofUrl || "—"}
Contenu / description :
${documentExcerpt || "—"}

Réponds en JSON :
{
  "confidenceScore": 0-100,
  "verdict": "validated" | "pending" | "insufficient" | "expert_needed",
  "analysis": "analyse courte",
  "opinion": "avis EDGE",
  "badgeSuggested": true/false
}`;

    const result = await generateJSON(prompt);
    if (!result?.verdict) {
      return NextResponse.json({ error: "Analyse impossible" }, { status: 500 });
    }

    const service = getServiceRoleClient();
    const profileRes = await (service ?? supabase)
      .from("profiles")
      .select("first_name, email")
      .eq("id", userData.user.id)
      .maybeSingle();

    const firstName = String(profileRes.data?.first_name ?? "");
    const email = String(profileRes.data?.email ?? userData.user.email ?? "");

    await sendSkillValidationEmails({
      firstName,
      email,
      skillName,
      verdict: String(result.verdict) as "validated" | "pending" | "insufficient" | "expert_needed",
      sendProofReceived: true,
    });

    return NextResponse.json({
      confidenceScore: Number(result.confidenceScore) || 0,
      verdict: result.verdict,
      analysis: String(result.analysis ?? ""),
      opinion: String(result.opinion ?? ""),
      badgeSuggested: Boolean(result.badgeSuggested),
    });
  } catch (error) {
    console.error("[skill-validation/import]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
