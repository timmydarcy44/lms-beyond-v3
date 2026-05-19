import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const [{ data: authData, error: authError }, superAdmin] = await Promise.all([
    supabase.auth.getUser(),
    isSuperAdmin(),
  ]);
  if (authError) return NextResponse.json({ error: "auth", details: authError.message }, { status: 500 });
  const userId = authData?.user?.id ?? null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const client = await getServiceRoleClientOrFallback();
  if (!client) return NextResponse.json({ error: "Service role indisponible" }, { status: 500 });

  // compute orgIds like in getFormateurPaths
  let orgIds: string[] | null = null;
  let orgMembershipError: any | null = null;
  let memberships: any[] | null = null;

  if (!superAdmin) {
    const res = await client.from("org_memberships").select("org_id, role").eq("user_id", userId);
    memberships = (res as any).data ?? null;
    orgMembershipError = (res as any).error ?? null;
    if (!orgMembershipError && memberships?.length) {
      const staffRoles = new Set(["admin", "instructor", "formateur", "trainer", "super_admin", "staff", "owner"]);
      const normalized = (memberships as any[]).map((m) => ({
        org_id: String(m?.org_id ?? "").trim(),
        role: String(m?.role ?? "").toLowerCase().trim(),
      }));
      const staffIds = normalized.filter((m) => m.org_id && staffRoles.has(m.role)).map((m) => m.org_id);
      orgIds = Array.from(new Set((staffIds.length ? staffIds : normalized.map((m) => m.org_id)).filter(Boolean)));
    } else if (!orgMembershipError) {
      orgIds = [];
    } else {
      orgIds = null;
    }
  }

  const attempt = async (label: string, select: string, orgColumn: "org_id" | "organization_id") => {
    let q = client.from("paths").select(select).order("created_at", { ascending: false }).limit(20);
    if (Array.isArray(orgIds)) {
      if (orgIds.length === 0) return { label, skipped: true, reason: "orgIds empty", orgColumn };
      q = q.in(orgColumn, orgIds);
    }
    const res = await q;
    return {
      label,
      orgIds,
      orgColumn,
      error: (res as any).error ? { message: (res as any).error.message, code: (res as any).error.code } : null,
      count: Array.isArray((res as any).data) ? (res as any).data.length : 0,
      sample: Array.isArray((res as any).data)
        ? (res as any).data.slice(0, 3).map((r: any) => ({ id: r.id, title: r.title, org_id: r.org_id }))
        : [],
    };
  };

  const attempts = [
    await attempt("full_org_id", "id, org_id, title, created_at, status, path_snapshot", "org_id"),
    await attempt("minimal_org_id", "id, org_id, title, created_at, path_snapshot", "org_id"),
    await attempt("minimal_organization_id", "id, title, created_at, path_snapshot", "organization_id"),
  ];

  return NextResponse.json({
    userId,
    superAdmin,
    orgIds,
    membershipsCount: memberships?.length ?? null,
    orgMembershipError: orgMembershipError ? { message: orgMembershipError.message, code: orgMembershipError.code } : null,
    attempts,
  });
}

