import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { missionApiErrorResponse } from "@/lib/apprenant/edge-mission-api-errors";
import { generateMissionBrief } from "@/lib/apprenant/edge-mission-generator";
import { getMissionCoachReply, generateMissionDebrief } from "@/lib/apprenant/edge-mission-engine";
import { computeMissionOutcome, initialMissionGauges } from "@/lib/apprenant/edge-mission-gauges";
import {
  buildDailyMissionPreview,
  enrichCoachMemoryWithMatching,
  fetchCoachMemory,
} from "@/lib/apprenant/edge-coach-memory";
import {
  createMissionRun,
  fetchPastMissionTitles,
  finishMissionEphemeral,
  finishMissionRun,
} from "@/lib/apprenant/edge-mission-store";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import type {
  MissionBrief,
  MissionChatMessage,
  MissionContext,
  MissionFormatId,
  MissionGauge,
  MissionGaugeTurn,
} from "@/lib/apprenant/edge-mission-types";
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

function parseMission(body: Record<string, unknown>): { mission: MissionBrief | null; missing: string[] } {
  const m = body.mission;
  if (!m || typeof m !== "object") {
    return { mission: null, missing: ["mission"] };
  }
  const brief = m as MissionBrief;
  const missing: string[] = [];
  if (!brief.title) missing.push("mission.title");
  if (!brief.primarySkill) missing.push("mission.primarySkill");
  if (missing.length) return { mission: null, missing };
  return { mission: brief, missing: [] };
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

function parseGauges(raw: unknown): MissionGauge[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const gauges = raw
    .filter((g) => g && typeof g === "object")
    .map((g) => {
      const o = g as Record<string, unknown>;
      return {
        key: String(o.key ?? "").slice(0, 40),
        name: String(o.name ?? "").slice(0, 80),
        value: Math.max(0, Math.min(100, Math.round(Number(o.value) || 0))),
      };
    })
    .filter((g) => g.key && g.name);
  return gauges.length ? gauges : undefined;
}

function parseGaugeHistory(raw: unknown): MissionGaugeTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && typeof t === "object")
    .map((t) => {
      const o = t as Record<string, unknown>;
      const deltas = Array.isArray(o.deltas)
        ? o.deltas
            .filter((d) => d && typeof d === "object")
            .map((d) => {
              const dd = d as Record<string, unknown>;
              return {
                name: String(dd.name ?? ""),
                delta: Number(dd.delta) || 0,
                reason: String(dd.reason ?? "").slice(0, 200),
              };
            })
        : [];
      return { turn: Number(o.turn) || 0, deltas };
    })
    .slice(-20);
}

function toContext(
  base: ReturnType<typeof parseBase>,
  mission: MissionBrief,
  coachMemory?: Awaited<ReturnType<typeof fetchCoachMemory>>,
  gaugeState?: MissionGauge[],
): MissionContext {
  const skillName = base.skillName || mission.primarySkill;
  return { ...base, skillName, mission, coachMemory, gaugeState };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json(missionApiErrorResponse(503, { error: "Service indisponible", code: "no_supabase" }), {
        status: 503,
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(missionApiErrorResponse(401, { error: "Non authentifié", code: "unauthorized" }), {
        status: 401,
      });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "reply");
    const base = parseBase(body);
    const db = await getServiceRoleClientOrFallback();

    if (action === "daily") {
      if (!db) {
        return NextResponse.json(missionApiErrorResponse(503, { error: "Service indisponible", code: "no_db" }), {
          status: 503,
        });
      }
      const matching = parseMatchingSnapshot(body);
      const memory = enrichCoachMemoryWithMatching(await fetchCoachMemory(db, user.id), matching);
      const preview = buildDailyMissionPreview(matching, memory);
      if (!preview) {
        return NextResponse.json(missionApiErrorResponse(404, { error: "Aucune mission disponible.", code: "no_daily" }), {
          status: 404,
        });
      }
      return NextResponse.json({ preview, coachName: memory.firstName });
    }

    if (action === "generate") {
      if (!base.skillName) {
        return NextResponse.json(
          missionApiErrorResponse(400, { error: "Compétence manquante.", code: "missing_skill", missing: ["skill"] }),
          { status: 400 },
        );
      }
      const pastMissionTitles =
        db && user.id ? await fetchPastMissionTitles(db, user.id, normalizeSkillSlug(base.skillName)) : [];
      const mission = await generateMissionBrief({ ...base, pastMissionTitles });
      return NextResponse.json({ mission });
    }

    const { mission, missing: missionMissing } = parseMission(body);
    if (!mission) {
      return NextResponse.json(
        missionApiErrorResponse(400, {
          error: "Brief mission manquant ou incomplet.",
          code: "missing_mission",
          missing: missionMissing,
        }),
        { status: 400 },
      );
    }

    const coachMemory = db ? await fetchCoachMemory(db, user.id) : undefined;
    const gaugeStateFromBody = parseGauges(body.gauges);
    const skillForGauges = base.skillName || mission.primarySkill;
    const initialGauges = parseGauges(body.initialGauges) ?? initialMissionGauges(skillForGauges);
    const ctx = toContext(
      base,
      mission,
      coachMemory,
      gaugeStateFromBody ?? initialGauges,
    );

    if (!ctx.skillName) {
      return NextResponse.json(
        missionApiErrorResponse(400, {
          error: "Compétence manquante.",
          code: "missing_skill",
          missing: ["skill", "mission.primarySkill"],
        }),
        { status: 400 },
      );
    }

    if (action === "start") {
      let runId: string;
      let ephemeral = false;

      if (db) {
        const created = await createMissionRun(db, user.id, ctx);
        if (created.ok) {
          runId = created.runId;
        } else {
          console.error("[api/learner/edge-mission] start persist failed", created);
          runId = `ephemeral-${randomUUID()}`;
          ephemeral = true;
        }
      } else {
        runId = `ephemeral-${randomUUID()}`;
        ephemeral = true;
      }

      ctx.gaugeState = initialGauges;
      const reply = await getMissionCoachReply(ctx, []);
      const gauges = reply.gauges ?? initialGauges;
      return NextResponse.json({
        runId,
        reply,
        mission: ctx.mission,
        ephemeral,
        gauges,
        initialGauges,
        gaugeHistory: [] as MissionGaugeTurn[],
        ...(ephemeral && process.env.NODE_ENV !== "production"
          ? { hint: "Persistance DB indisponible — mission en mode local (débrief sans XP persisté)." }
          : {}),
      });
    }

    if (action === "reply") {
      const messages = parseMessages(body);
      const gaugeHistory = parseGaugeHistory(body.gaugeHistory);
      const reply = await getMissionCoachReply(ctx, messages);
      const userTurns = messages.filter((m) => m.role === "user").length;
      const gauges = reply.gauges ?? ctx.gaugeState ?? initialGauges;
      const newHistory =
        reply.gaugeDeltas?.length && userTurns > 0
          ? [...gaugeHistory, { turn: userTurns, deltas: reply.gaugeDeltas }]
          : gaugeHistory;
      return NextResponse.json({
        reply,
        canFinish: userTurns >= 2,
        gauges,
        gaugeDeltas: reply.gaugeDeltas,
        gaugeHistory: newHistory,
      });
    }

    if (action === "finish") {
      const runId = String(body.runId ?? "").trim();
      if (!runId) {
        return NextResponse.json(
          missionApiErrorResponse(400, { error: "Mission introuvable.", code: "missing_run_id", missing: ["runId"] }),
          { status: 400 },
        );
      }
      const messages = parseMessages(body);
      const proofText = String(body.proofText ?? "").trim().slice(0, 4000);
      const gaugeHistory = parseGaugeHistory(body.gaugeHistory);
      const finalGauges = parseGauges(body.gauges) ?? ctx.gaugeState ?? initialGauges;
      ctx.gaugeState = finalGauges;
      const outcome = computeMissionOutcome(finalGauges);
      const gaugeState = {
        initial: initialGauges,
        final: finalGauges,
        history: gaugeHistory,
        outcome,
      };

      const debrief = await generateMissionDebrief(ctx, messages, proofText);
      debrief.outcome = outcome;
      const isEphemeral = Boolean(body.ephemeral) || runId.startsWith("ephemeral-");

      if (isEphemeral || !db) {
        const result = await finishMissionEphemeral(db, user.id, runId, ctx, debrief, gaugeState);
        return NextResponse.json({ ...result, ephemeral: true, outcome, gaugeState });
      }

      const result = await finishMissionRun(
        db,
        user.id,
        runId,
        ctx,
        debrief,
        messages,
        proofText,
        gaugeState,
      );
      return NextResponse.json({ ...result, outcome, gaugeState });
    }

    return NextResponse.json(missionApiErrorResponse(400, { error: "Action inconnue.", code: "unknown_action" }), {
      status: 400,
    });
  } catch (error) {
    console.error("[api/learner/edge-mission]", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      missionApiErrorResponse(500, { error: "Erreur serveur", code: "server_error", details: message }),
      { status: 500 },
    );
  }
}
