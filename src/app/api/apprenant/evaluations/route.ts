import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ evaluations: [] }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { data, error } = await supabase
    .from("evaluations")
    .select("id, type, due_date, status, self_sent_at, sent_at")
    .eq("student_id", auth.user.id)
    .order("due_date", { ascending: true });
  if (error) return NextResponse.json({ evaluations: [] });
  return NextResponse.json({ evaluations: data ?? [] });
}
