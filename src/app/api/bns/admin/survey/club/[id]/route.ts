import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ ok: false, errorId: "FORBIDDEN" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("bns_club_survey_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, errorId: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data });
}

