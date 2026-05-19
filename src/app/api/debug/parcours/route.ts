import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = await getServiceRoleClientOrFallback();
  if (!admin) return NextResponse.json({ error: "Service role indisponible" }, { status: 500 });

  // 1) memberships
  const { data: memberships, error: mErr } = await admin
    .from("org_memberships")
    .select("org_id, role")
    .eq("user_id", userId)
    .limit(50);

  // 2) enrollments
  const { data: enrollments, error: eErr } = await admin
    .from("path_enrollments")
    .select("path_id, created_at")
    .eq("user_id", userId)
    .limit(200);

  const pathIds = Array.isArray(enrollments)
    ? enrollments.map((r: any) => String(r?.path_id ?? "").trim()).filter(Boolean)
    : [];

  // 3) paths (ne pas sélectionner de colonnes optionnelles: selon les DB, `organization_id` n'existe pas)
  const { data: paths, error: pErr } = pathIds.length
    ? await admin
        .from("paths")
        .select("id, title, org_id, status, path_snapshot")
        .in("id", pathIds)
        .limit(200)
    : ({ data: [], error: null } as any);

  return NextResponse.json({
    userId,
    membershipsCount: Array.isArray(memberships) ? memberships.length : 0,
    memberships: memberships ?? null,
    membershipsError: mErr ? { message: mErr.message, code: mErr.code } : null,
    enrollmentsCount: Array.isArray(enrollments) ? enrollments.length : 0,
    pathIds,
    enrollmentsError: eErr ? { message: eErr.message, code: eErr.code } : null,
    pathsCount: Array.isArray(paths) ? paths.length : 0,
    paths,
    pathsError: pErr ? { message: pErr.message, code: pErr.code } : null,
  });
}

