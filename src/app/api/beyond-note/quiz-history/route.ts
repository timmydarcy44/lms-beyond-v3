import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("quiz_history")
    .select("topic,is_correct")
    .eq("user_id", session.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats = new Map<string, { total: number; incorrect: number }>();
  data?.forEach((row) => {
    if (!row.topic) return;
    const current = stats.get(row.topic) || { total: 0, incorrect: 0 };
    current.total += 1;
    if (!row.is_correct) current.incorrect += 1;
    stats.set(row.topic, current);
  });

  const weakTopics = Array.from(stats.entries())
    .map(([topic, values]) => ({
      topic,
      score: values.total > 0 ? values.incorrect / values.total : 0,
      incorrect: values.incorrect,
    }))
    .sort((a, b) => b.score - a.score || b.incorrect - a.incorrect)
    .slice(0, 5)
    .map((item) => item.topic);

  return NextResponse.json({ weakTopics });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = await request.json();
  const { document_id, folder_id, topic, is_correct, question_type } = body || {};

  if (typeof is_correct !== "boolean") {
    return NextResponse.json({ error: "is_correct requis" }, { status: 400 });
  }

  const { error } = await supabase.from("quiz_history").insert({
    user_id: session.id,
    document_id: document_id || null,
    folder_id: folder_id || null,
    topic: topic || null,
    is_correct,
    question_type: question_type || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
