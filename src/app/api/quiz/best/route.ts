import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Meilleur score (0–100) de l’apprenant connecté, par quiz. */
export async function GET(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const testIds = [...new Set(
    (request.nextUrl.searchParams.get("testIds") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^[0-9a-f-]{36}$/i.test(id)),
  )].slice(0, 40);

  if (!testIds.length) return NextResponse.json({ scores: {} });

  const { data, error } = await supabase
    .from("quiz_submissions")
    .select("test_id, score")
    .eq("user_id", user.id)
    .in("test_id", testIds);

  if (error) {
    console.error("[quiz/best]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const scores: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = String(row.test_id ?? "");
    const score = Number(row.score);
    if (!id || !Number.isFinite(score)) continue;
    scores[id] = Math.max(scores[id] ?? 0, Math.round(score));
  }

  return NextResponse.json({ scores });
}
