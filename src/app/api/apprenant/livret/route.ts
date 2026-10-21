import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ booklet: null, periods: [] }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const booklet = await supabase.from("apprenticeship_booklets").select("*").eq("student_id", auth.user.id).maybeSingle();
  if (!booklet.data) return NextResponse.json({ booklet: null, periods: [], signatures: [] });
  const periods = await supabase.from("booklet_periods").select("*").eq("booklet_id", booklet.data.id).order("index");
  const ids = (periods.data ?? []).map((row) => String(row.id));
  const signatures = ids.length ? await supabase.from("booklet_signatures").select("*").in("period_id", ids) : { data: [] };
  return NextResponse.json({ booklet: booklet.data, periods: periods.data ?? [], signatures: signatures.data ?? [] });
}
