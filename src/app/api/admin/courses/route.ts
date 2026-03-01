import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const queryOrgId = url.searchParams.get("organizationId");
  if (queryOrgId && queryOrgId !== auth.user.orgId) {
    return NextResponse.json({ error: "ORG_MISMATCH" }, { status: 400 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_UNAVAILABLE" }, { status: 503 });
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title")
    .eq("org_id", auth.user.orgId)
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "COURSES_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, courses: courses ?? [] });
}
