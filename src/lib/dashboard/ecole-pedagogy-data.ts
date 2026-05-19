import type { SupabaseClient } from "@supabase/supabase-js";

export type EcoleQuizSubmissionRow = {
  id: string;
  test_id: string;
  user_id: string;
  score: number;
  created_at: string;
  test_title: string | null;
};

export type EcoleFormationTimeAggregate = {
  user_id: string;
  course_id: string;
  course_title: string | null;
  total_seconds: number;
  active_seconds: number;
};

function testsTitleFromRow(tests: unknown): string | null {
  if (!tests) return null;
  if (Array.isArray(tests)) {
    const t = tests[0];
    return t && typeof t === "object" && "title" in t ? String((t as { title?: string }).title ?? "") || null : null;
  }
  if (typeof tests === "object" && tests !== null && "title" in tests) {
    return String((tests as { title?: string }).title ?? "") || null;
  }
  return null;
}

/**
 * Données pédagogiques agrégées pour les apprenants rattachés à une école (IDs fournis).
 * Préférer un client service pour éviter les blocages RLS sur quiz_submissions / learning_sessions.
 */
export async function loadSchoolPedagogyInsights(
  client: SupabaseClient,
  learnerIds: string[],
): Promise<{
  quizRows: EcoleQuizSubmissionRow[];
  formationTime: EcoleFormationTimeAggregate[];
}> {
  if (!learnerIds.length) {
    return { quizRows: [], formationTime: [] };
  }

  const { data: quizData, error: quizErr } = await client
    .from("quiz_submissions")
    .select("id, test_id, user_id, score, created_at, tests(title)")
    .in("user_id", learnerIds)
    .order("created_at", { ascending: false })
    .limit(600);

  if (quizErr) {
    console.error("[ecole-pedagogy] quiz_submissions:", quizErr.message);
  }

  const quizRows: EcoleQuizSubmissionRow[] = (quizData ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    test_id: String(row.test_id ?? ""),
    user_id: String(row.user_id ?? ""),
    score: typeof row.score === "number" ? row.score : Number(row.score) || 0,
    created_at: String(row.created_at ?? ""),
    test_title: testsTitleFromRow(row.tests),
  }));

  const { data: sessData, error: sessErr } = await client
    .from("learning_sessions")
    .select("user_id, content_id, duration_seconds, duration_active_seconds")
    .eq("content_type", "course")
    .in("user_id", learnerIds)
    .limit(5000);

  if (sessErr) {
    console.error("[ecole-pedagogy] learning_sessions:", sessErr.message);
  }

  const sessions = (sessData ?? []) as Array<{
    user_id: string;
    content_id: string;
    duration_seconds: number | null;
    duration_active_seconds: number | null;
  }>;

  const courseIds = [...new Set(sessions.map((s) => s.content_id).filter(Boolean))];

  const titleMap = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courses, error: cErr } = await client.from("courses").select("id, title").in("id", courseIds);
    if (cErr) {
      console.error("[ecole-pedagogy] courses:", cErr.message);
    }
    for (const c of courses ?? []) {
      const r = c as { id?: string; title?: string | null };
      if (r.id) titleMap.set(r.id, String(r.title ?? "").trim() || "Formation");
    }
  }

  const agg = new Map<string, EcoleFormationTimeAggregate>();
  for (const s of sessions) {
    const uid = s.user_id;
    const cid = s.content_id;
    if (!uid || !cid) continue;
    const key = `${uid}\0${cid}`;
    const prev =
      agg.get(key) ??
      ({
        user_id: uid,
        course_id: cid,
        course_title: titleMap.get(cid) ?? null,
        total_seconds: 0,
        active_seconds: 0,
      } satisfies EcoleFormationTimeAggregate);
    prev.total_seconds += Number(s.duration_seconds) || 0;
    prev.active_seconds += Number(s.duration_active_seconds) || 0;
    prev.course_title = titleMap.get(cid) ?? prev.course_title;
    agg.set(key, prev);
  }

  const formationTime = [...agg.values()].sort((a, b) => b.total_seconds - a.total_seconds);

  return { quizRows, formationTime };
}

export function formatDurationFr(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return s >= 1 ? `${s} s` : "—";
}
