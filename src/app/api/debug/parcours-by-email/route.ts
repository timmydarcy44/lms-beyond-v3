import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(request: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const url = new URL(request.url);
  const email = String(url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email requis" }, { status: 400 });

  const admin = await getServiceRoleClientOrFallback();
  if (!admin) return NextResponse.json({ error: "Service role indisponible" }, { status: 500 });

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("id, email, role, full_name")
    .ilike("email", email)
    .maybeSingle();

  if (pErr) return NextResponse.json({ error: "profiles lookup failed", details: pErr.message, code: pErr.code }, { status: 500 });
  if (!profile?.id) return NextResponse.json({ error: "Profil introuvable", email }, { status: 404 });

  const userId = String((profile as any).id);

  const { data: memberships, error: mErr } = await admin
    .from("org_memberships")
    .select("org_id, role")
    .eq("user_id", userId)
    .limit(50);

  const { data: enrollments, error: eErr } = await admin
    .from("path_enrollments")
    .select("path_id, created_at")
    .eq("user_id", userId)
    .limit(200);

  const pathIds = Array.isArray(enrollments)
    ? enrollments.map((r: any) => String(r?.path_id ?? "").trim()).filter(Boolean)
    : [];

  const { data: paths, error: pathsErr } = pathIds.length
    ? await admin
        .from("paths")
        .select("id, title, org_id, status, path_snapshot")
        .in("id", pathIds)
        .limit(200)
    : ({ data: [], error: null } as any);

  return NextResponse.json({
    email,
    profile: {
      id: userId,
      role: (profile as any).role ?? null,
      full_name: (profile as any).full_name ?? null,
    },
    membershipsCount: Array.isArray(memberships) ? memberships.length : 0,
    memberships,
    membershipsError: mErr ? { message: mErr.message, code: mErr.code } : null,
    enrollmentsCount: Array.isArray(enrollments) ? enrollments.length : 0,
    pathIds,
    enrollmentsError: eErr ? { message: eErr.message, code: eErr.code } : null,
    pathsCount: Array.isArray(paths) ? paths.length : 0,
    paths,
    pathsError: pathsErr ? { message: pathsErr.message, code: pathsErr.code } : null,
  });
}

