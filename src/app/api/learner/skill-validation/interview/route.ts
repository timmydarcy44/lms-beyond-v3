import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { interviewQuestionCount } from "@/lib/hard-skills/skill-validation";
import {
  parseSkillAnalysisApiResult,
  SKILL_ANALYSIS_JSON_SHAPE,
} from "@/lib/hard-skills/skill-validation-analysis";
import { sendSkillValidationEmails } from "@/lib/hard-skills/send-skill-validation-emails";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const action = String(body?.action ?? "questions");
    const skillName = String(body?.skillName ?? "").trim();
    const level = String(body?.level ?? "Intermédiaire") as HardSkillLevel;
    const careerTitle = String(body?.careerTitle ?? "").trim();

    if (!skillName) return NextResponse.json({ error: "Compétence requise" }, { status: 400 });

    if (action === "questions") {
      const count = interviewQuestionCount(level);
      const prompt = `Tu es un expert EDGE en validation de compétences professionnelles.
Génère exactement ${count} questions d'entretien expérientiel (PAS de QCM) pour évaluer la compétence "${skillName}" au niveau "${level}"${careerTitle ? ` pour le métier "${careerTitle}"` : ""}.

Chaque question doit explorer une expérience concrète : projets, méthodes, outils, résultats, difficultés.
Réponds en JSON : { "questions": ["question 1", ...] }`;

      const result = await generateJSON(prompt);
      const questions = Array.isArray(result?.questions)
        ? result.questions.map(String).filter(Boolean).slice(0, count)
        : [];

      if (!questions.length) {
        return NextResponse.json({ error: "Génération des questions impossible" }, { status: 500 });
      }

      return NextResponse.json({ questions });
    }

    if (action === "analyze") {
      const answers = Array.isArray(body?.answers) ? body.answers.map(String) : [];
      const questions = Array.isArray(body?.questions) ? body.questions.map(String) : [];

      const prompt = `Analyse cet entretien expérientiel EDGE pour la compétence "${skillName}" (niveau déclaré : ${level}).

Questions et réponses :
${questions.map((q: string, i: number) => `Q${i + 1}: ${q}\nR: ${answers[i] ?? "(vide)"}`).join("\n\n")}

Réponds en JSON :
${SKILL_ANALYSIS_JSON_SHAPE}`;

      const result = await generateJSON(prompt);
      if (!result?.verdict) {
        return NextResponse.json({ error: "Analyse impossible" }, { status: 500 });
      }

      const parsed = parseSkillAnalysisApiResult(result as Record<string, unknown>, level);

      const verdict = parsed.verdict;
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
        verdict: verdict as "validated" | "pending" | "insufficient" | "expert_needed",
      });

      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("[skill-validation/interview]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
