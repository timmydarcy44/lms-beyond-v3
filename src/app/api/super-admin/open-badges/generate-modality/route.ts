import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isBadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import { generateModality, writeAnthropicCasePrompt } from "@/lib/openbadges/modality-generation";

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    methodId?: string;
    activityType?: string;
    badgeName?: string;
    level?: string;
    characterName?: string;
    purpose?: string;
    criteria?: Array<{ label?: string; expectedOutcome?: string | null }>;
  } | null;
  const criteria = (body?.criteria ?? [])
    .map((item) => ({ label: String(item?.label ?? "").trim(), expectedOutcome: item?.expectedOutcome ?? "" }))
    .filter((item) => item.label);
  const characterName = String(body?.characterName ?? "").trim();
  if (body?.purpose === "anthropic") {
    if (!characterName) {
      return NextResponse.json({ error: "Indiquez le prénom du personnage." }, { status: 400 });
    }
    if (criteria.length === 0) {
      return NextResponse.json({ error: "Choisissez au moins un critère." }, { status: 400 });
    }
    try {
      const prompt = await writeAnthropicCasePrompt({
        badgeName: String(body.badgeName ?? "").trim(),
        level: String(body.level ?? "").trim(),
        characterName,
        criteria,
      });
      return NextResponse.json({ prompt });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Création impossible";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
  const methodId = body?.methodId ?? "";
  if (!isBadgeEvaluationMethodId(methodId) || methodId === "qcm") {
    return NextResponse.json({ error: "Cette modalité se crée autrement." }, { status: 400 });
  }
  if (body?.activityType === "module") {
    return NextResponse.json({ error: "Le module interactif s'importe. L'IA ne le rédige pas." }, { status: 400 });
  }
  if (methodId === "case_study" && !characterName) {
    return NextResponse.json({ error: "Indiquez le prénom du personnage." }, { status: 400 });
  }
  if (criteria.length === 0) {
    return NextResponse.json({ error: "Choisissez au moins un critère." }, { status: 400 });
  }
  try {
    const modality = await generateModality({
      methodId,
      activityType: body?.activityType,
      badgeName: String(body?.badgeName ?? "").trim(),
      level: String(body?.level ?? "").trim(),
      characterName,
      criteria,
    });
    return NextResponse.json({ modality });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Création impossible";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
