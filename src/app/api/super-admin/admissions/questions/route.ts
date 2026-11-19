import { NextRequest, NextResponse } from "next/server";

import { generateJSON } from "@/lib/ai/openai-client";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  ADMISSION_CHALLENGE_PROPOSALS,
  proposalsForTrack,
} from "@/lib/cfa/admission-challenge-proposals";
import { CFA_SPECIALIZATIONS, getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";

async function ensureVersions(
  db: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  questionIds: string[],
) {
  for (const id of questionIds) {
    const { data: q } = await db
      .from("admission_challenge_questions")
      .select("id, label, prompt, starter_hint")
      .eq("id", id)
      .maybeSingle();
    if (!q) continue;
    const { data: existing } = await db
      .from("admission_challenge_question_versions")
      .select("id")
      .eq("question_id", id)
      .eq("version", 1)
      .maybeSingle();
    if (existing) continue;
    await db.from("admission_challenge_question_versions").insert({
      question_id: id,
      version: 1,
      label: q.label,
      prompt: q.prompt,
      starter_hint: q.starter_hint,
    });
  }
}

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const track = request.nextUrl.searchParams.get("track")?.trim() || "ai_business";
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: common } = await db
    .from("admission_challenge_questions")
    .select("*")
    .eq("specialization", "common")
    .order("sort_order");
  const { data: questions } = await db
    .from("admission_challenge_questions")
    .select("*")
    .eq("specialization", track)
    .order("sort_order");

  const { data: allTracks } = await db
    .from("admission_challenge_questions")
    .select("specialization")
    .neq("specialization", "common")
    .neq("specialization", "_fallback");

  const counts: Record<string, number> = {};
  for (const row of allTracks ?? []) {
    const key = String(row.specialization);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return NextResponse.json({
    common: common ?? [],
    questions: questions ?? [],
    proposals: proposalsForTrack(track),
    trackCounts: counts,
  });
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "").trim();
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  if (action === "create") {
    const specialization = String(body?.specialization ?? "").trim();
    const label = String(body?.label ?? "").trim();
    const prompt = String(body?.prompt ?? "").trim();
    const starter = String(body?.starter_hint ?? "").trim();
    const slugBase = String(body?.slug ?? (label || "question"))
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 48);
    const slug = `${slugBase || "question"}_${Date.now().toString(36)}`;
    if (!specialization || !label || !prompt) {
      return NextResponse.json({ error: "Filière, libellé et question requis." }, { status: 400 });
    }
    const { data: existing } = await db
      .from("admission_challenge_questions")
      .select("sort_order")
      .eq("specialization", specialization)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = Number(existing?.sort_order ?? 0) + 1;
    const { data, error } = await db
      .from("admission_challenge_questions")
      .insert({
        specialization,
        slug,
        label,
        prompt,
        starter_hint: starter || null,
        sort_order: sortOrder,
        active: true,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await ensureVersions(db, [String(data.id)]);
    return NextResponse.json({ ok: true, question: data });
  }

  if (action === "seed_proposals") {
    const track = String(body?.specialization ?? "").trim();
    const onlyMissing = body?.onlyMissing !== false;
    const proposals = track
      ? proposalsForTrack(track)
      : ADMISSION_CHALLENGE_PROPOSALS;
    if (!proposals.length) {
      return NextResponse.json({ error: "Aucune proposition pour cette filière." }, { status: 404 });
    }

    let inserted = 0;
    let skipped = 0;
    const ids: string[] = [];
    for (const proposal of proposals) {
      if (onlyMissing) {
        const { count } = await db
          .from("admission_challenge_questions")
          .select("id", { count: "exact", head: true })
          .eq("specialization", proposal.specialization)
          .eq("slug", proposal.slug);
        if ((count ?? 0) > 0) {
          skipped += 1;
          continue;
        }
      }
      const { data, error } = await db
        .from("admission_challenge_questions")
        .upsert(
          {
            specialization: proposal.specialization,
            slug: proposal.slug,
            label: proposal.label,
            prompt: proposal.prompt,
            starter_hint: proposal.starter_hint,
            sort_order: proposal.sort_order,
            active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "specialization,slug" },
        )
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      inserted += 1;
      ids.push(String(data.id));
    }
    await ensureVersions(db, ids);

    // Prérequis bac pour les filières nouvellement équipées
    for (const spec of [...new Set(proposals.map((p) => p.specialization))]) {
      await db.from("admission_track_prerequisites").upsert(
        {
          specialization: spec,
          required_diploma: "bac",
          label: "Bac (général, technologique ou pro)",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "specialization" },
      );
    }

    return NextResponse.json({ ok: true, inserted, skipped });
  }

  if (action === "generate_ai") {
    const specialization = String(body?.specialization ?? "").trim();
    if (!CFA_SPECIALIZATIONS.some((s) => s.value === specialization)) {
      return NextResponse.json({ error: "Filière invalide." }, { status: 400 });
    }
    const label = getCfaSpecializationLabel(specialization);
    const group = CFA_SPECIALIZATIONS.find((s) => s.value === specialization)?.group ?? "";
    const existing = proposalsForTrack(specialization);

    type AiOut = {
      questions: Array<{ label: string; prompt: string; starter_hint: string }>;
    };

    let generated: AiOut["questions"] = [];
    try {
      const result = (await generateJSON(
        `Propose exactement 2 questions pour la filière « ${label} » (${group}).
Contraintes :
- chaque question tient en 1–2 phrases max
- étiquette courte (1 mot ou 2) : Curiosité, Projection, Observation, etc.
- starter_hint = début de phrase pour aider le candidat
- pas de niveau scolaire, pas de QCM
Exemples du ton attendu : ${JSON.stringify(existing.slice(0, 2))}
Réponds avec un JSON { "questions": [ { "label": "", "prompt": "", "starter_hint": "" }, ... ] }`,
        {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  prompt: { type: "string" },
                  starter_hint: { type: "string" },
                },
                required: ["label", "prompt", "starter_hint"],
              },
            },
          },
          required: ["questions"],
        },
        "Tu écris des questions de candidature pour Byound School (jeunes 16–20 ans, alternance). Ton : clair, concret, sans jargon RH. Pas de bonne/mauvaise réponse.",
      )) as AiOut | null;
      generated = Array.isArray(result?.questions) ? result.questions.slice(0, 2) : [];
    } catch {
      generated = [];
    }

    if (generated.length < 2) {
      // Repli : propositions humaines
      return NextResponse.json({
        ok: true,
        source: "proposals",
        questions: proposalsForTrack(specialization).map((q) => ({
          label: q.label,
          prompt: q.prompt,
          starter_hint: q.starter_hint,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      source: "ai",
      questions: generated.map((q) => ({
        label: String(q.label || "Question").trim().slice(0, 40),
        prompt: String(q.prompt || "").trim().slice(0, 400),
        starter_hint: String(q.starter_hint || "Je…").trim().slice(0, 80),
      })),
    });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}

export async function PATCH(request: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const id = String(body.id);
  const { data: current } = await db
    .from("admission_challenge_questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "Question introuvable" }, { status: 404 });

  const label = String(body.label ?? current.label).trim();
  const prompt = String(body.prompt ?? current.prompt).trim();
  const starter = String(body.starter_hint ?? current.starter_hint ?? "").trim();
  const active = body.active === undefined ? current.active : Boolean(body.active);
  const sortOrder = Number(body.sort_order ?? current.sort_order) || 0;

  const textChanged =
    label !== current.label || prompt !== current.prompt || starter !== (current.starter_hint ?? "");

  const { error } = await db
    .from("admission_challenge_questions")
    .update({
      label,
      prompt,
      starter_hint: starter || null,
      active,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (textChanged) {
    const { data: last } = await db
      .from("admission_challenge_question_versions")
      .select("version")
      .eq("question_id", id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = Number(last?.version ?? 0) + 1;
    await db.from("admission_challenge_question_versions").insert({
      question_id: id,
      version: nextVersion,
      label,
      prompt,
      starter_hint: starter || null,
    });
  }

  return NextResponse.json({ ok: true });
}
