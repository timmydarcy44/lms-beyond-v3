import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  type SuperAdminMemberApiRole,
  upsertOrgMember,
} from "@/lib/super-admin/upsert-org-member";
import { getServiceSupabase } from "@/lib/supabase/service";

const MAX_ROWS = 400;

type RowIn = {
  email?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
};

function normalizeApiRole(raw: unknown): SuperAdminMemberApiRole | null {
  const r = String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!r) return null;
  if (r === "admin" || r === "administrateur") return "admin";
  if (r === "trainer" || r === "formateur" || r === "instructor") return "trainer";
  if (r === "student" || r === "learner" || r === "apprenant") return "student";
  if (r === "tutor" || r === "tuteur") return "tutor";
  if (r === "handicap_referent") return "handicap_referent";
  if (
    r === "handicap_referent" ||
    r === "referent_handicap" ||
    r === "referenthandicap" ||
    r === "referent_handicape" ||
    (r.includes("referent") && r.includes("handicap"))
  ) {
    return "handicap_referent";
  }
  return null;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const allowed = await isSuperAdmin();
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "MISSING_ORG_ID" }, { status: 400 });

  let body: { rows?: RowIn[]; tempPassword?: string; attachSchoolId?: boolean } = {};
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
  const attachSchoolId = body.attachSchoolId !== false;

  try {
    const supabase = await getServiceSupabase();
    const results: Array<{ email: string; ok: boolean; userId?: string; error?: string; details?: string }> = [];

    for (const row of rowsIn) {
      const email = String(row.email ?? "")
        .trim()
        .toLowerCase();
      const apiRole = normalizeApiRole(row.role) ?? "student";
      const firstName = (row.firstName ?? row.first_name ?? "").trim();
      const lastName = (row.lastName ?? row.last_name ?? "").trim();

      if (!email) {
        results.push({ email: "", ok: false, error: "EMAIL_REQUIRED" });
        continue;
      }

      const r = await upsertOrgMember({
        supabase,
        orgId: id,
        email,
        apiRole,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        tempPassword: tempPassword || undefined,
        attachSchoolId,
      });

      if (r.ok) {
        results.push({ email, ok: true, userId: r.userId });
      } else {
        results.push({ email, ok: false, error: r.error, details: r.details });
      }
    }

    const okCount = results.filter((x) => x.ok).length;
    return NextResponse.json({ ok: true, processed: results.length, successCount: okCount, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("members bulk:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
