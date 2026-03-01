import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const parseBoolean = (value: string | null) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debugMode = process.env.NODE_ENV !== "production" && searchParams.get("debug") === "1";

  const authClient = await getServerClient();
  const { data: authData } = authClient ? await authClient.auth.getUser() : { data: null };
  const authUid = authData?.user?.id ?? null;

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  let isSuperAdminFlag = await isSuperAdmin();
  if (!isSuperAdminFlag && authUid) {
    const { data: fallbackAdmin } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", authUid)
      .eq("is_active", true)
      .maybeSingle();
    if (fallbackAdmin) {
      isSuperAdminFlag = true;
    }
  }

  if (!isSuperAdminFlag) {
    return NextResponse.json(
      { ok: false, errorId: "FORBIDDEN", message: "Accès super admin requis", authUid },
      { status: 403 },
    );
  }

  const q = searchParams.get("q")?.trim() ?? "";
  const optin = parseBoolean(searchParams.get("optin"));
  const validation = searchParams.get("validation");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? 50), 1), 5000);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  if (debugMode) {
    const { data: debugRows, count } = await supabase
      .from("bns_club_survey_responses")
      .select("created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(0, 0);

    return NextResponse.json({
      ok: true,
      authUid,
      isSuperAdmin: true,
      count: count ?? 0,
      firstRowCreatedAt: debugRows?.[0]?.created_at ?? null,
    });
  }

  const includeFull = searchParams.get("include") === "full";

  let query = supabase
    .from("bns_club_survey_responses")
    .select(
      includeFull
        ? "id, created_at, club, first_name, last_name, role, email, phone, preferred_validation, beyond_connect_optin, hard_skills, soft_skills, market_gap, preferred_contact_channel"
        : "id, created_at, club, first_name, last_name, role, email, preferred_validation, beyond_connect_optin",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `club.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  if (optin !== null) {
    query = query.eq("beyond_connect_optin", optin);
  }

  if (validation) {
    query = query.eq("preferred_validation", validation);
  }

  if (from) {
    query = query.gte("created_at", from);
  }

  if (to) {
    query = query.lte("created_at", to);
  }

  const { data, count, error } = await query.range(rangeFrom, rangeTo);

  if (error) {
    return NextResponse.json({ ok: false, errorId: "FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}

