import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerClient } from "@/lib/supabase/server";

const AnswersSchema = z.record(z.string().max(80), z.string().max(12000));

const BodySchema = z.object({
  courseId: z.string().uuid(),
  blockId: z.string().min(1).max(200),
  answers: AnswersSchema,
});

type OutputRow = {
  id: string;
  version: number;
  answers: Record<string, unknown> | null;
  ai_feedback: unknown;
  is_final: boolean;
  updated_at: string | null;
};

function cleanAnswers(raw: Record<string, unknown> | null | undefined) {
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (typeof value === "string") answers[key] = value;
  }
  return answers;
}

async function loadRows(userId: string, courseId: string, blockId: string) {
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase non configuré" }, { status: 500 }) };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const { data, error } = await supabase
    .from("learner_workshop_outputs")
    .select("id, version, answers, ai_feedback, is_final, updated_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("block_id", blockId)
    .order("version", { ascending: false });
  if (error) return { error: NextResponse.json({ error: "Impossible de lire le brouillon." }, { status: 500 }) };
  return { supabase, user, rows: (data ?? []) as OutputRow[] };
}

function takeLoaded(value: Awaited<ReturnType<typeof loadRows>>) {
  if ("error" in value) return { ok: false as const, response: value.error };
  return { ok: true as const, supabase: value.supabase, rows: value.rows };
}

function present(rows: OutputRow[]) {
  const finalRow = rows.find((row) => row.is_final) ?? null;
  const draft = rows.find((row) => !row.is_final) ?? null;
  const current = finalRow ?? draft;
  return {
    final: Boolean(finalRow),
    answers: cleanAnswers(current?.answers),
    feedback: current?.ai_feedback ?? null,
    feedbackCount: rows.filter((row) => row.ai_feedback != null).length,
    updatedAt: current?.updated_at ?? null,
  };
}

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId") ?? "";
  const blockId = request.nextUrl.searchParams.get("blockId") ?? "";
  const parsed = BodySchema.pick({ courseId: true, blockId: true }).safeParse({ courseId, blockId });
  if (!parsed.success) return NextResponse.json({ error: "Atelier introuvable." }, { status: 400 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const loaded = takeLoaded(await loadRows(user.id, parsed.data.courseId, parsed.data.blockId));
  if (!loaded.ok) return loaded.response;
  return NextResponse.json(present(loaded.rows));
}

export async function PATCH(request: NextRequest) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Le brouillon est incomplet." }, { status: 400 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const loaded = takeLoaded(await loadRows(user.id, parsed.data.courseId, parsed.data.blockId));
  if (!loaded.ok) return loaded.response;

  const { rows } = loaded;
  if (rows.some((row) => row.is_final)) {
    return NextResponse.json({ ...present(rows), error: "Cette réponse est déjà validée." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const draft = rows.find((row) => !row.is_final);
  if (draft) {
    const { error } = await loaded.supabase
      .from("learner_workshop_outputs")
      .update({ answers: parsed.data.answers, updated_at: now })
      .eq("id", draft.id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: "Impossible d'enregistrer le brouillon." }, { status: 500 });
    draft.answers = parsed.data.answers;
    draft.updated_at = now;
    return NextResponse.json(present(rows));
  }

  const { error } = await loaded.supabase.from("learner_workshop_outputs").insert({
    user_id: user.id,
    course_id: parsed.data.courseId,
    block_id: parsed.data.blockId,
    answers: parsed.data.answers,
    is_final: false,
    updated_at: now,
  });
  if (error) return NextResponse.json({ error: "Impossible d'enregistrer le brouillon." }, { status: 500 });
  return NextResponse.json({
    final: false,
    answers: parsed.data.answers,
    feedback: null,
    feedbackCount: 0,
    updatedAt: now,
  });
}

export async function POST(request: NextRequest) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "La réponse est incomplète." }, { status: 400 });
  if (!Object.values(parsed.data.answers).some((item) => item.trim().length > 0)) {
    return NextResponse.json({ error: "Écrivez une réponse avant de la valider." }, { status: 400 });
  }

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const loaded = takeLoaded(await loadRows(user.id, parsed.data.courseId, parsed.data.blockId));
  if (!loaded.ok) return loaded.response;

  const existingFinal = loaded.rows.find((row) => row.is_final);
  if (existingFinal) return NextResponse.json(present(loaded.rows));

  const now = new Date().toISOString();
  const draft = loaded.rows.find((row) => !row.is_final);
  if (draft) {
    const { error } = await loaded.supabase
      .from("learner_workshop_outputs")
      .update({ answers: parsed.data.answers, is_final: true, updated_at: now })
      .eq("id", draft.id)
      .eq("user_id", user.id)
      .eq("is_final", false);
    if (error) return NextResponse.json({ error: "Impossible de valider la réponse." }, { status: 500 });
    draft.answers = parsed.data.answers;
    draft.is_final = true;
    draft.updated_at = now;
    return NextResponse.json(present(loaded.rows));
  }

  const { error: insertError } = await loaded.supabase.from("learner_workshop_outputs").insert({
    user_id: user.id,
    course_id: parsed.data.courseId,
    block_id: parsed.data.blockId,
    answers: parsed.data.answers,
    is_final: false,
    updated_at: now,
  });
  if (insertError) return NextResponse.json({ error: "Impossible de valider la réponse." }, { status: 500 });

  const again = takeLoaded(await loadRows(user.id, parsed.data.courseId, parsed.data.blockId));
  if (!again.ok) return again.response;
  const refreshedRows = again.rows;
  const created = refreshedRows.find((row) => !row.is_final);
  if (!created) return NextResponse.json({ error: "Impossible de valider la réponse." }, { status: 500 });
  const { error } = await again.supabase
    .from("learner_workshop_outputs")
    .update({ is_final: true, updated_at: now })
    .eq("id", created.id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Impossible de valider la réponse." }, { status: 500 });
  created.is_final = true;
  return NextResponse.json(present(refreshedRows));
}
