import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  type SuperAdminMemberApiRole,
  upsertOrgMember,
} from "@/lib/super-admin/upsert-org-member";
import { getServiceSupabase } from "@/lib/supabase/service";

type Body = {
  email?: string;
  role?: "admin" | "trainer" | "student" | "tutor" | "handicap_referent";
  firstName?: string;
  lastName?: string;
  fullName?: string;
  tempPassword?: string;
  /** défaut true : `profiles.school_id` = org (CFA) */
  attachSchoolId?: boolean;
  /** défaut : apprenants → ligne school_students si attachSchoolId */
  enrollSchoolStudent?: boolean;
};

function mapBodyRole(role: Body["role"]): SuperAdminMemberApiRole {
  if (role === "trainer") return "trainer";
  if (role === "student") return "student";
  if (role === "tutor") return "tutor";
  if (role === "handicap_referent") return "handicap_referent";
  return "admin";
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const allowed = await isSuperAdmin();
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "MISSING_ORG_ID" }, { status: 400 });

  try {
    const supabase = await getServiceSupabase();

    // memberships (org_id vs organisation_id)
    let memberships: any[] = [];
    {
      const r1 = await supabase.from("org_memberships").select("user_id, role").eq("org_id", id);
      if (r1.error?.code === "42703") {
        const r2 = await supabase.from("org_memberships").select("user_id, role").eq("organisation_id", id);
        if (r2.error) {
          console.error("❌ ERREUR SUPABASE MEMBRES:", r2.error);
          return NextResponse.json({ error: r2.error.message }, { status: 500 });
        }
        memberships = r2.data ?? [];
      } else if (r1.error) {
        console.error("❌ ERREUR SUPABASE MEMBRES:", r1.error);
        return NextResponse.json({ error: r1.error.message }, { status: 500 });
      } else {
        memberships = r1.data ?? [];
      }
    }

    const userIds = memberships.map((m) => m.user_id).filter(Boolean);
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const p1 = await supabase.from("profiles").select("id, email, full_name, first_name, last_name").in("id", userIds);
      if (p1.error?.code === "42703") {
        const p2 = await supabase.from("profiles").select("id, email, full_name").in("id", userIds);
        if (p2.error) {
          console.error("❌ ERREUR SUPABASE PROFILES:", p2.error);
          return NextResponse.json({ error: p2.error.message }, { status: 500 });
        }
        profiles = p2.data ?? [];
      } else if (p1.error) {
        console.error("❌ ERREUR SUPABASE PROFILES:", p1.error);
        return NextResponse.json({ error: p1.error.message }, { status: 500 });
      } else {
        profiles = p1.data ?? [];
      }
    }

    const map = new Map(profiles.map((p) => [p.id, p]));
    const members = memberships.map((m) => {
      const p = map.get(m.user_id) ?? {};
      return {
        user_id: m.user_id,
        role: m.role,
        email: p.email ?? "",
        full_name: p.full_name ?? "",
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
      };
    });

    return NextResponse.json({ ok: true, members });
  } catch (err: any) {
    console.error("❌ ERREUR API MEMBERS GET (500):", err?.message ?? err, err);
    return NextResponse.json({ error: err?.message || "Erreur inconnue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const allowed = await isSuperAdmin();
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "MISSING_ORG_ID" }, { status: 400 });

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch (error) {
    console.error("❌ ERREUR API MEMBERS: invalid JSON", error);
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const apiRole = mapBodyRole(body.role ?? "student");
  const tempPassword = (body.tempPassword ?? "").trim();
  const attachSchoolId = body.attachSchoolId !== false;
  const enrollSchoolStudent = body.enrollSchoolStudent;

  const first = (body.firstName ?? "").trim();
  const last = (body.lastName ?? "").trim();
  const explicitFull = (body.fullName ?? "").trim();
  const fullFromParts = [first, last].filter(Boolean).join(" ").trim();
  const fullName = fullFromParts || explicitFull;

  if (!email) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });

  try {
    const supabase = await getServiceSupabase();
    const result = await upsertOrgMember({
      supabase,
      orgId: id,
      email,
      apiRole,
      firstName: first || undefined,
      lastName: last || undefined,
      fullName: fullName || undefined,
      tempPassword: tempPassword || undefined,
      attachSchoolId,
      enrollSchoolStudent,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.error === "EMAIL_REQUIRED" ? 400 : 500 },
      );
    }

    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (err: any) {
    console.error("❌ ERREUR API MEMBERS (500):", err?.message ?? err, err);
    return NextResponse.json({ error: err?.message || "Erreur inconnue" }, { status: 500 });
  }
}

