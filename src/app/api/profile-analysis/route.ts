import { NextRequest, NextResponse } from "next/server";
import {
  buildProfileAnalysisTestsSignature,
  generateProfileAnalysisText,
  saveProfileAnalysisToDb,
} from "@/lib/learner/profile-analysis";
import { getServerClient } from "@/lib/supabase/server";

type AnalysisPayload = {
  firstName: string;
  jobTitle?: string | null;
  objectiveLabel?: string | null;
  discScores: Record<string, number>;
  idmcScores: Record<string, number>;
  softSkillsTop?: Array<{ skill?: string; label?: string; score?: number; value?: number }>;
  careerMatching?: {
    compatibilityScore?: number | null;
    strengths?: string[];
    consolidate?: string[];
    develop?: string[];
    unevaluated?: string[];
    nextPrioritySkill?: string | null;
  } | null;
  testsSignature?: string;
  discUpdatedAt?: string | null;
  idmcUpdatedAt?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as AnalysisPayload;
    const firstName = body?.firstName || "l'utilisateur";
    const discScores = body?.discScores ?? {};
    const idmcScores = body?.idmcScores ?? {};

    const softSkillsTop = (body?.softSkillsTop ?? []).map((item) => ({
      skill: item.skill ?? item.label ?? "",
      score: Number(item.score ?? item.value ?? 0),
    }));

    const testsSignature =
      body?.testsSignature ??
      buildProfileAnalysisTestsSignature({
        discScores,
        idmcScores,
        softSkills: softSkillsTop,
      });

    const analysis = await generateProfileAnalysisText({
      firstName,
      jobTitle: body?.jobTitle ?? null,
      objectiveLabel: body?.objectiveLabel ?? null,
      discScores,
      idmcScores,
      softSkillsTop,
      careerMatching: body?.careerMatching ?? null,
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analyse vide." }, { status: 500 });
    }

    const updatedAt = await saveProfileAnalysisToDb(supabase, user.id, analysis, {
      testsSignature,
      discUpdatedAt: body?.discUpdatedAt ?? null,
      idmcUpdatedAt: body?.idmcUpdatedAt ?? null,
    });

    return NextResponse.json({ analysis, updatedAt });
  } catch (error) {
    console.error("[profile-analysis]", error);
    const message = error instanceof Error ? error.message : "Erreur inattendue";
    const status = message.includes("OpenAI") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
