import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateBadgeFromBrief, type DemandLevel } from "@/lib/openbadges/badge-course-generation";
import { getServiceRoleClient } from "@/lib/supabase/server";

function demandOf(value: unknown): DemandLevel {
  if (value === "decouverte" || value === "expertise") return value;
  return "maitrise";
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    prompt?: string;
    library?: string[];
    domains?: string[];
    demand?: DemandLevel;
  } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Décrivez la thématique du badge." }, { status: 400 });
  }

  try {
    const result = await generateBadgeFromBrief({
      text: prompt,
      demand: demandOf(body?.demand),
      library: body?.library ?? [],
      domains: body?.domains ?? [],
    });
    const supabase = getServiceRoleClient();
    if (supabase && result.logs.length) {
      await supabase.from("ai_generation_logs").insert(result.logs.map((log) => ({
        context: "badge-from-prompt",
        prompt: log.pass,
        payload_in: { model: log.model, pass: log.pass },
        payload_out: {
          inputTokens: log.inputTokens,
          outputTokens: log.outputTokens,
          durationMs: log.durationMs,
          estimatedCostUsd: log.estimatedCostUsd,
          regenerations: log.regenerations,
          notes: log.notes,
        },
        status: result.badge ? "success" : "error",
      }))).then(() => undefined, () => undefined);
    }
    if (!result.badge) {
      return NextResponse.json({
        error: "La génération n'a pas abouti",
        detail: result.issues.join(" ") || "Le modèle n'a pas renvoyé de badge exploitable.",
        issues: result.issues,
      }, { status: 422 });
    }
    return NextResponse.json({ badge: result.badge, issues: result.issues });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur génération";
    return NextResponse.json({ error: "La génération a échoué", detail: message }, { status: 502 });
  }
}
