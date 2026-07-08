import { NextRequest, NextResponse } from "next/server";



import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

import { generateMissionBrief } from "@/lib/apprenant/edge-mission-generator";

import { getMissionCoachReply, generateMissionDebrief } from "@/lib/apprenant/edge-mission-engine";

import {

  buildDailyMissionPreview,

  enrichCoachMemoryWithMatching,

  fetchCoachMemory,

} from "@/lib/apprenant/edge-coach-memory";

import {

  createMissionRun,

  fetchPastMissionTitles,

  finishMissionRun,

} from "@/lib/apprenant/edge-mission-store";

import type {

  CareerMatchingResult,

} from "@/lib/career-profiles/career-profile-matching";

import type { MissionBrief, MissionChatMessage, MissionContext, MissionFormatId } from "@/lib/apprenant/edge-mission-types";

import { normalizeSkillSlug } from "@/lib/apprenant/edge-mission-types";



const VALID_FORMATS: MissionFormatId[] = ["story", "situation", "proof", "video", "ai", "quickchallenge"];



function parseBase(body: Record<string, unknown>) {

  const rawFormat = String(body.format ?? "situation") as MissionFormatId;

  return {

    skillName: String(body.skill ?? body.skillName ?? "").trim().slice(0, 120),

    objective: String(body.objective ?? "").trim().slice(0, 300),

    levelCurrent: String(body.levelCurrent ?? body.level ?? "").trim().slice(0, 40),

    levelExpected: String(body.levelExpected ?? body.target ?? "").trim().slice(0, 40),

    format: VALID_FORMATS.includes(rawFormat) ? rawFormat : "situation",

  };

}



function parseMatchingSnapshot(body: Record<string, unknown>): CareerMatchingResult {

  const np = body.nextPriority;

  const nextPriority =
    np && typeof np === "object" && "skill" in (np as object)
      ? {
          skill: String((np as { skill: string }).skill),
          impactPercent: Number((np as { impactPercent?: number }).impactPercent) || 0,
          actionType: "evaluation" as const,
          actionLabel: String((np as { actionLabel?: string }).actionLabel ?? ""),
        }
      : null;



  return {
    compatibilityScore: Number(body.compatibilityScore) || 0,
    strengths: Array.isArray(body.strengths) ? body.strengths.map(String) : [],
    consolidate: Array.isArray(body.consolidate) ? body.consolidate.map(String) : [],
    develop: Array.isArray(body.develop) ? body.develop.map(String) : [],
    unevaluated: Array.isArray(body.unevaluated) ? body.unevaluated.map(String) : [],
    skillTable: [],
    actionPlanAxes: [],
    nextPriority,
    gaps: Array.isArray(body.develop) ? body.develop.map(String) : [],
  };
}



function parseMission(body: Record<string, unknown>): MissionBrief | null {

  const m = body.mission;

  if (!m || typeof m !== "object") return null;

  const brief = m as MissionBrief;

  if (!brief.title || !brief.primarySkill) return null;

  return brief;

}



function parseMessages(body: Record<string, unknown>): MissionChatMessage[] {

  const raw = Array.isArray(body.messages) ? body.messages : [];

  return raw

    .filter(

      (msg): msg is MissionChatMessage =>

        Boolean(msg) && (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string",

    )

    .map((msg) => ({

      role: msg.role,

      content: String(msg.content).slice(0, 4000),

      kind: msg.kind === "coach" || msg.kind === "scene" ? msg.kind : undefined,

      coachInsight: msg.coachInsight,

    }))

    .slice(-40);

}



function toContext(

  base: ReturnType<typeof parseBase>,

  mission: MissionBrief,

  coachMemory?: Awaited<ReturnType<typeof fetchCoachMemory>>,

): MissionContext {

  return { ...base, skillName: base.skillName || mission.primarySkill, mission, coachMemory };

}



async function loadCoachMemory(db: Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>, userId: string) {

  if (!db) return undefined;

  return fetchCoachMemory(db, userId);

}



export async function POST(request: NextRequest) {

  try {

    const supabase = await getServerClient();

    if (!supabase) {

      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    }



    const {

      data: { user },

      error: authError,

    } = await supabase.auth.getUser();

    if (authError || !user) {

      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    }



    const body = (await request.json()) as Record<string, unknown>;

    const action = String(body.action ?? "reply");

    const base = parseBase(body);

    const db = await getServiceRoleClientOrFallback();



    if (action === "daily") {

      if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

      const matching = parseMatchingSnapshot(body);

      const memory = enrichCoachMemoryWithMatching(await fetchCoachMemory(db, user.id), matching);

      const preview = buildDailyMissionPreview(matching, memory);

      if (!preview) {

        return NextResponse.json({ error: "Aucune mission disponible." }, { status: 404 });

      }

      return NextResponse.json({ preview, coachName: memory.firstName });

    }



    if (!base.skillName && action !== "generate") {

      return NextResponse.json({ error: "Compétence manquante." }, { status: 400 });

    }



    if (action === "generate") {

      if (!base.skillName) {

        return NextResponse.json({ error: "Compétence manquante." }, { status: 400 });

      }

      const pastMissionTitles =

        db && user.id

          ? await fetchPastMissionTitles(db, user.id, normalizeSkillSlug(base.skillName))

          : [];

      const mission = await generateMissionBrief({

        ...base,

        pastMissionTitles,

      });

      return NextResponse.json({ mission });

    }



    const mission = parseMission(body);

    if (!mission && action !== "generate") {

      return NextResponse.json({ error: "Brief mission manquant." }, { status: 400 });

    }



    const coachMemory = await loadCoachMemory(db, user.id);

    const ctx = toContext(base, mission!, coachMemory);



    if (action === "start") {

      if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

      const runId = await createMissionRun(db, user.id, ctx);

      if (!runId) {

        return NextResponse.json({ error: "Impossible de démarrer la mission." }, { status: 500 });

      }

      const reply = await getMissionCoachReply(ctx, []);

      return NextResponse.json({ runId, reply, mission: ctx.mission });

    }



    if (action === "reply") {

      const messages = parseMessages(body);

      const reply = await getMissionCoachReply(ctx, messages);

      const userTurns = messages.filter((m) => m.role === "user").length;

      return NextResponse.json({ reply, canFinish: userTurns >= 2 });

    }



    if (action === "finish") {

      const runId = String(body.runId ?? "").trim();

      if (!runId) {

        return NextResponse.json({ error: "Mission introuvable." }, { status: 400 });

      }

      const messages = parseMessages(body);

      const proofText = String(body.proofText ?? "").trim().slice(0, 4000);

      const debrief = await generateMissionDebrief(ctx, messages, proofText);

      if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

      const result = await finishMissionRun(db, user.id, runId, ctx, debrief, messages, proofText);

      return NextResponse.json(result);

    }



    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });

  } catch (error) {

    console.error("[api/learner/edge-mission]", error);

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });

  }

}

