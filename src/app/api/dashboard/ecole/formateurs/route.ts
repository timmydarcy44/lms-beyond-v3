import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { parseStringList } from "@/lib/ecole/instructors";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function resolveSchoolClient() {
  const session = await getSession();
  if (!session?.id) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) return { error: NextResponse.json({ error: "NO_SCHOOL" }, { status: 403 }) };
  const db = getServiceRoleClient() ?? supabase;
  return { session, schoolId, db };
}

export async function GET() {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const { data: instructors, error } = await db
    .from("school_instructors")
    .select("*")
    .eq("school_id", schoolId)
    .order("last_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ids = (instructors ?? []).map((i: { id: string }) => i.id);
  const hoursByInstructor = new Map<string, number>();
  if (ids.length) {
    const { data: slots } = await db
      .from("school_planning_slots")
      .select("instructor_id, duration_hours, status")
      .eq("school_id", schoolId)
      .in("instructor_id", ids)
      .neq("status", "cancelled");
    for (const s of slots ?? []) {
      const id = String((s as { instructor_id?: string }).instructor_id ?? "");
      if (!id) continue;
      hoursByInstructor.set(
        id,
        (hoursByInstructor.get(id) ?? 0) + Number((s as { duration_hours?: number }).duration_hours ?? 0),
      );
    }
  }

  const enriched = (instructors ?? []).map((i: Record<string, unknown>) => ({
    ...i,
    hours_assigned: Math.round((hoursByInstructor.get(String(i.id)) ?? 0) * 100) / 100,
  }));

  const stats = {
    total: enriched.length,
    active: enriched.filter((i) => i.status === "active").length,
    invited: enriched.filter((i) => i.status === "invited").length,
    incomplete: enriched.filter((i) => i.status === "incomplete").length,
    inactive: enriched.filter((i) => i.status === "inactive").length,
    hours_total: enriched.reduce((a, i) => a + Number(i.hours_assigned ?? 0), 0),
  };

  return NextResponse.json({ instructors: enriched, stats });
}

/** Création manuelle d’un formateur (disponible immédiatement pour le planning si actif). */
export async function POST(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const firstName = String(body.first_name ?? "").trim();
  const lastName = String(body.last_name ?? "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  const { data: existing } = await db
    .from("school_instructors")
    .select("id")
    .eq("school_id", schoolId)
    .ilike("email", email)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "EMAIL_ALREADY_EXISTS", id: existing.id }, { status: 409 });
  }

  const status = String(body.status ?? "active");
  const row = {
    school_id: schoolId,
    email,
    first_name: firstName,
    last_name: lastName,
    phone: body.phone ? String(body.phone) : null,
    photo_url: body.photo_url ? String(body.photo_url) : null,
    address: body.address ? String(body.address) : null,
    expertise: parseStringList(body.expertise),
    teachable_subjects: parseStringList(body.teachable_subjects),
    status: ["active", "invited", "incomplete", "inactive"].includes(status) ? status : "active",
    availability: typeof body.availability === "object" && body.availability ? body.availability : {},
    job_title: body.job_title ? String(body.job_title) : null,
    company: body.company ? String(body.company) : null,
    bio: body.bio ? String(body.bio) : null,
    linkedin_url: body.linkedin_url ? String(body.linkedin_url) : null,
    pedagogical_experience: body.pedagogical_experience ? String(body.pedagogical_experience) : null,
    levels: parseStringList(body.levels),
    internal_notes: body.internal_notes ? String(body.internal_notes) : null,
    activated_at: status === "active" || !body.status ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db.from("school_instructors").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let expertInvite: Record<string, unknown> | null = null;
  if (body.invite_expert !== false) {
    const { inviteSchoolInstructorAsExpert } = await import("@/lib/ecole/invite-instructor-as-expert");
    const { data: org } = await db.from("organizations").select("name").eq("id", schoolId).maybeSingle();
    const result = await inviteSchoolInstructorAsExpert(db, {
      instructorId: data.id,
      email,
      firstName,
      lastName,
      expertise: parseStringList(body.expertise),
      schoolName: String((org as { name?: string } | null)?.name ?? "EDGE"),
    });
    expertInvite = result as unknown as Record<string, unknown>;
  }

  return NextResponse.json({ instructor: data, expert_invite: expertInvite });
}
