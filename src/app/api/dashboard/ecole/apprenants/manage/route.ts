import { NextRequest, NextResponse } from "next/server";

import { fetchSchoolGateProfile, schoolDashboardAllowed } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { upsertOrgMember } from "@/lib/super-admin/upsert-org-member";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseUuidRpcResult(data: unknown): string[] {
  if (data == null) return [];
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    if (typeof data[0] === "string") return data as string[];
    if (typeof data[0] === "object" && data[0] !== null) {
      const row = data[0] as Record<string, unknown>;
      const key = Object.keys(row).find((k) => k.startsWith("ecole_")) ?? Object.keys(row)[0];
      if (!key) return [];
      return (data as Record<string, string>[]).map((r) => r[key]).filter(Boolean);
    }
  }
  return [];
}

type Body = {
  action?: "link_by_token" | "create_or_update";
  token?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  school_class?: string;
  contract_type?: string;
  company_id?: string | null;
  avatar_url?: string | null;
  /** Inscription au cursus (`class_enrollments`) en plus du libellé `school_class`. */
  class_id?: string | null;
};

const MAX_AVATAR_URL_LEN = 180_000;

async function enrollInClassIfRequested(
  svc: Awaited<ReturnType<typeof getServiceSupabase>>,
  schoolId: string,
  classIdRaw: unknown,
  studentId: string,
) {
  const classId = String(classIdRaw ?? "").trim();
  if (!UUID_RE.test(classId) || !UUID_RE.test(studentId)) return;
  const { data: row, error } = await svc
    .from("school_classes")
    .select("id")
    .eq("id", classId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (error || !row?.id) return;
  const { error: insErr } = await svc.from("class_enrollments").insert({
    class_id: classId,
    student_id: studentId,
  });
  if (insErr && insErr.code !== "23505") {
    console.error("[ecole/apprenants/manage] class_enrollments", insErr);
  }
}

function normalizeAvatarUrl(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (s.length > MAX_AVATAR_URL_LEN) return null;
  const lower = s.slice(0, 12).toLowerCase();
  if (lower.startsWith("data:image/")) return s;
  if (lower.startsWith("http://") || lower.startsWith("https://")) return s;
  return null;
}

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

  let svc: Awaited<ReturnType<typeof getServiceSupabase>>;
  try {
    svc = await getServiceSupabase();
  } catch {
    return NextResponse.json({ error: "SERVICE_NOT_CONFIGURED" }, { status: 500 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const action = body.action ?? "create_or_update";

  const phoneVal = String(body.phone ?? "").trim() || null;
  const avatarUrl = normalizeAvatarUrl(body.avatar_url);

  const companyPatch =
    body.company_id && String(body.company_id) !== "not_listed" ? { company_id: String(body.company_id) } : {};

  try {
    if (action === "link_by_token") {
      const raw = String(body.token ?? "").trim();
      if (!raw) {
        return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
      }
      const normalized = raw.toUpperCase().startsWith("APP-") ? raw.slice(4).trim() : raw;
      const tokenLower = normalized.toLowerCase();
      let profileId: string | null = null;

      if (tokenLower.includes("@")) {
        const { data, error } = await svc
          .from("profiles")
          .select("id")
          .ilike("email", normalized)
          .maybeSingle();
        if (error) throw error;
        profileId = data?.id ?? null;
      } else if (UUID_RE.test(normalized)) {
        const { data, error } = await svc.from("profiles").select("id").eq("id", normalized).maybeSingle();
        if (error) throw error;
        profileId = data?.id ?? null;
      } else {
        const { data: ids, error: rpcError } = await svc.rpc("ecole_admin_find_profile_fragment", {
          p_school_id: schoolId,
          p_fragment: normalized,
        });
        if (rpcError) {
          if (rpcError.code === "42883" || rpcError.message?.includes("function")) {
            return NextResponse.json(
              {
                error: "MIGRATION_REQUIRED",
                details:
                  "Appliquez la migration Supabase 20260503190000_ecole_profile_fragment_lookup.sql pour activer la recherche par fragment d'ID.",
              },
              { status: 503 },
            );
          }
          throw rpcError;
        }
        const list = parseUuidRpcResult(ids);
        if (list.length > 1) {
          return NextResponse.json(
            { error: "AMBIGUOUS_TOKEN", details: "Plusieurs profils correspondent. Précisez l'UUID complet ou l'email." },
            { status: 409 },
          );
        }
        profileId = list[0] ?? null;
      }

      if (!profileId) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }

      const sc = String(body.school_class ?? "").trim();
      const ct = String(body.contract_type ?? "").trim();
      const { data: updated, error: upErr } = await svc
        .from("profiles")
        .update({
          school_id: schoolId,
          role_type: "apprenant",
          role: "student",
          ...(sc ? { school_class: sc } : {}),
          ...(ct ? { contract_type: ct } : {}),
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          ...companyPatch,
        })
        .eq("id", profileId)
        .select("*")
        .single();
      if (upErr) throw upErr;

      const { error: ssErr } = await svc.from("school_students").insert({
        school_id: schoolId,
        student_id: profileId,
      });
      if (ssErr && ssErr.code !== "23505" && ssErr.code !== "42P01") {
        throw ssErr;
      }

      await enrollInClassIfRequested(svc, schoolId, body.class_id, profileId);

      return NextResponse.json({ ok: true, profile: updated });
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
    }
    const first = String(body.first_name ?? "").trim();
    const last = String(body.last_name ?? "").trim();
    if (!first || !last) {
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    }

    const { data: existing } = await svc.from("profiles").select("id").eq("email", email).maybeSingle();
    const sc = String(body.school_class ?? "").trim();
    const ct = String(body.contract_type ?? "").trim();

    if (existing?.id) {
      const { data, error } = await svc
        .from("profiles")
        .update({
          first_name: first,
          last_name: last,
          phone: phoneVal,
          telephone: phoneVal,
          school_class: sc || null,
          contract_type: ct || null,
          role_type: "apprenant",
          school_id: schoolId,
          role: "student",
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          ...companyPatch,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      const { error: ssErr } = await svc.from("school_students").insert({
        school_id: schoolId,
        student_id: existing.id,
      });
      if (ssErr && ssErr.code !== "23505" && ssErr.code !== "42P01") {
        throw ssErr;
      }
      await enrollInClassIfRequested(svc, schoolId, body.class_id, existing.id);
      return NextResponse.json({ ok: true, profile: data });
    }

    const r = await upsertOrgMember({
      supabase: svc,
      orgId: schoolId,
      email,
      apiRole: "student",
      firstName: first,
      lastName: last,
      attachSchoolId: true,
      enrollSchoolStudent: true,
      profileRoleOverride: "student",
      roleTypeOverride: "apprenant",
      phone: phoneVal ?? undefined,
      schoolClass: sc || undefined,
      contractType: ct || undefined,
      avatarUrl: avatarUrl ?? undefined,
    });
    if (!r.ok) {
      const details = "details" in r ? String((r as { details?: string }).details ?? "") : "";
      return NextResponse.json({ error: r.error, details: details || undefined }, { status: 400 });
    }
    if (Object.keys(companyPatch).length) {
      await svc.from("profiles").update(companyPatch).eq("id", r.userId);
    }
    const { data: createdProfile, error: fetchErr } = await svc
      .from("profiles")
      .select("*")
      .eq("id", r.userId)
      .single();
    if (fetchErr) throw fetchErr;

    await enrollInClassIfRequested(svc, schoolId, body.class_id, r.userId);

    return NextResponse.json({ ok: true, profile: createdProfile });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    console.error("[ecole/apprenants/manage]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
