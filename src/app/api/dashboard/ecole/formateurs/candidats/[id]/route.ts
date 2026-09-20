import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { parseStringList } from "@/lib/ecole/instructors";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await resolveSchoolClient();
  if ("error" in auth && auth.error) return auth.error;
  const { schoolId, db } = auth as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };
  const { id } = await ctx.params;

  const { data, error } = await db
    .from("school_instructor_candidates")
    .select("*")
    .eq("school_id", schoolId)
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ candidate: data });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await resolveSchoolClient();
  if ("error" in auth && auth.error) return auth.error;
  const { schoolId, db } = auth as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.action === "convert_to_instructor" || body.action === "retain_and_invite") {
    const inviteExpert = body.action === "retain_and_invite" || body.invite_expert === true;
    const { data: candidate } = await db
      .from("school_instructor_candidates")
      .select("*")
      .eq("id", id)
      .eq("school_id", schoolId)
      .maybeSingle();
    if (!candidate) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (candidate.converted_instructor_id && !inviteExpert) {
      return NextResponse.json({
        instructor_id: candidate.converted_instructor_id,
        already_converted: true,
      });
    }

    const email = String(candidate.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "CANDIDATE_EMAIL_REQUIRED" }, { status: 400 });
    }

    const { data: existingInst } = await db
      .from("school_instructors")
      .select("id")
      .eq("school_id", schoolId)
      .ilike("email", email)
      .maybeSingle();

    let instructorId = (candidate.converted_instructor_id || existingInst?.id) as string | undefined;
    if (!instructorId) {
      const { data: created, error } = await db
        .from("school_instructors")
        .insert({
          school_id: schoolId,
          email,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          phone: candidate.phone,
          expertise: candidate.expertise ?? [],
          teachable_subjects: candidate.expertise ?? [],
          availability: candidate.availability
            ? { note: candidate.availability }
            : {},
          pedagogical_experience: candidate.experience,
          status: inviteExpert ? "invited" : "active",
          activated_at: inviteExpert ? null : new Date().toISOString(),
          internal_notes: candidate.internal_notes,
        })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      instructorId = created.id;
    }

    await db
      .from("school_instructor_candidates")
      .update({
        status: "retained",
        converted_instructor_id: instructorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    let expertInvite = null;
    if (inviteExpert) {
      const { inviteSchoolInstructorAsExpert } = await import("@/lib/ecole/invite-instructor-as-expert");
      const { data: org } = await db.from("organizations").select("name").eq("id", schoolId).maybeSingle();
      expertInvite = await inviteSchoolInstructorAsExpert(db, {
        instructorId: String(instructorId),
        email,
        firstName: String(candidate.first_name ?? ""),
        lastName: String(candidate.last_name ?? ""),
        expertise: Array.isArray(candidate.expertise) ? candidate.expertise.map(String) : [],
        schoolName: String((org as { name?: string } | null)?.name ?? "EDGE"),
      });
    }

    return NextResponse.json({
      instructor_id: instructorId,
      converted: true,
      expert_invite: expertInvite,
    });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) {
    const s = String(body.status);
    if (["new", "review", "contact", "interview", "retained", "refused"].includes(s)) {
      patch.status = s;
    }
  }
  if (body.internal_notes !== undefined) patch.internal_notes = String(body.internal_notes);
  if (body.expertise !== undefined) patch.expertise = parseStringList(body.expertise);
  if (body.availability !== undefined) patch.availability = String(body.availability);
  if (body.experience !== undefined) patch.experience = String(body.experience);

  const { data, error } = await db
    .from("school_instructor_candidates")
    .update(patch)
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ candidate: data });
}
