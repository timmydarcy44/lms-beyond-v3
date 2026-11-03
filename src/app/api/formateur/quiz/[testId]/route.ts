import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sanitizeEditableQuizQuestions, toEditableQuizQuestions } from "@/lib/formateur/quiz-questions";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const TEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ testId: string }> };

async function loadOwnedQuiz(testId: string) {
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase non configuré" }, { status: 500 }) };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  if (!TEST_ID.test(testId)) return { error: NextResponse.json({ error: "Quiz introuvable" }, { status: 404 }) };

  const db = getServiceRoleClient() ?? supabase;
  let { data, error } = await db
    .from("tests")
    .select("id, title, questions, scoring, creator_id, owner_id")
    .eq("id", testId)
    .maybeSingle();
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ data, error } = await db.from("tests").select("id, title, questions, creator_id, owner_id").eq("id", testId).maybeSingle());
  }
  if (error || !data) return { error: NextResponse.json({ error: "Quiz introuvable" }, { status: 404 }) };

  const row = data as { creator_id?: string; owner_id?: string };
  const owner = String(row.creator_id ?? row.owner_id ?? "");
  if (owner && owner !== user.id && !(await isSuperAdmin())) {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { db, data };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { testId } = await params;
  const loaded = await loadOwnedQuiz(testId);
  if ("error" in loaded && loaded.error) return loaded.error;
  const row = loaded.data as { title?: string; questions?: unknown; scoring?: unknown };
  return NextResponse.json({
    title: String(row.title ?? ""),
    questions: toEditableQuizQuestions(row.questions),
    scoring: row.scoring ?? null,
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { testId } = await params;
  const loaded = await loadOwnedQuiz(testId);
  if ("error" in loaded && loaded.error) return loaded.error;

  const body = (await request.json().catch(() => null)) as { title?: string; questions?: unknown; scoring?: unknown } | null;
  const title = String(body?.title ?? "").trim();
  const questions = sanitizeEditableQuizQuestions(body?.questions);
  if (!title || !questions) {
    return NextResponse.json({ error: "Titre et questions requis" }, { status: 400 });
  }

  const payload: Record<string, unknown> = { title, questions };
  if (body && "scoring" in body) payload.scoring = body.scoring ?? null;

  let { error } = await loaded.db.from("tests").update(payload).eq("id", testId);
  if (error && (error.code === "42703" || error.code === "PGRST204") && "scoring" in payload) {
    delete payload.scoring;
    ({ error } = await loaded.db.from("tests").update(payload).eq("id", testId));
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, test_id: testId });
}
