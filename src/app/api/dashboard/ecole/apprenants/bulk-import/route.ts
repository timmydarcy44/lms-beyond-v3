import { NextRequest, NextResponse } from "next/server";

import { fetchSchoolGateProfile, schoolDashboardAllowed } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { upsertOrgMember } from "@/lib/super-admin/upsert-org-member";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const MAX_ROWS = 400;

type RowIn = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  school_class?: string;
  contract_type?: string;
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const userClient = await getServerClient();
  if (!userClient) {
    return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  }

  const isDemo = session.role === "demo";
  const gate = await fetchSchoolGateProfile(session.id, session.email, userClient);
  /** Toujours évaluer comme pour la page apprenants (le pathname middleware peut être celui de la route API). */
  const allowed = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: "/dashboard/ecole/apprenants",
  });

  if (!allowed) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const schoolId = gate?.school_id ?? null;
  if (!schoolId) {
    return NextResponse.json({ error: "NO_SCHOOL_ID" }, { status: 400 });
  }

  let body: { rows?: RowIn[]; tempPassword?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const rowsIn = body.rows;
  if (!Array.isArray(rowsIn) || rowsIn.length === 0) {
    return NextResponse.json({ error: "ROWS_REQUIRED" }, { status: 400 });
  }
  if (rowsIn.length > MAX_ROWS) {
    return NextResponse.json({ error: "TOO_MANY_ROWS", max: MAX_ROWS }, { status: 400 });
  }

  const tempPassword = (body.tempPassword ?? "").trim();

  try {
    const svc = await getServiceSupabase();
    const results: Array<{ email: string; ok: boolean; userId?: string; error?: string; details?: string }> = [];

    for (const row of rowsIn) {
      const email = String(row.email ?? "")
        .trim()
        .toLowerCase();
      const firstName = String(row.first_name ?? "").trim();
      const lastName = String(row.last_name ?? "").trim();
      const phone = String(row.phone ?? "").trim();
      const schoolClass = String(row.school_class ?? "").trim();
      const contractType = String(row.contract_type ?? "").trim();

      if (!email || !email.includes("@")) {
        results.push({ email: email || "(vide)", ok: false, error: "INVALID_EMAIL" });
        continue;
      }

      const r = await upsertOrgMember({
        supabase: svc,
        orgId: schoolId,
        email,
        apiRole: "student",
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        tempPassword: tempPassword || undefined,
        attachSchoolId: true,
        enrollSchoolStudent: true,
        profileRoleOverride: "student",
        roleTypeOverride: "apprenant",
        phone: phone || null,
        schoolClass: schoolClass || null,
        contractType: contractType || null,
      });

      if (r.ok) {
        results.push({ email, ok: true, userId: r.userId });
      } else {
        results.push({ email, ok: false, error: r.error, details: r.details });
      }
    }

    const successCount = results.filter((x) => x.ok).length;
    return NextResponse.json({
      ok: true,
      schoolId,
      processed: results.length,
      successCount,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("ecole bulk-import:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
