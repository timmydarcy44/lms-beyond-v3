import { NextResponse } from "next/server";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("bns_proof_paths")
    .select("id, title, slug, description, trigger_label")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, errorId: "PATHS_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, paths: data ?? [] });
}

