import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiresAt,
} from "@/lib/ecole/instructor-invite";
import { inviteSchoolInstructorAsExpert } from "@/lib/ecole/invite-instructor-as-expert";
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

/** Inviter un formateur via le workflow Expert (auth + /dashboard/expert). */
export async function POST(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { session, schoolId, db } = ctx as {
    session: { id: string };
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const firstName = String(body.first_name ?? "").trim();
  const lastName = String(body.last_name ?? "").trim();
  const renewInstructorId = body.instructor_id ? String(body.instructor_id) : null;

  if (!renewInstructorId && (!email || !email.includes("@"))) {
    return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
  }

  let instructorId = renewInstructorId;
  let instructorEmail = email;
  let instructorFirst = firstName;
  let instructorLast = lastName;
  let expertise: string[] = [];

  if (renewInstructorId) {
    const { data: existing } = await db
      .from("school_instructors")
      .select("*")
      .eq("id", renewInstructorId)
      .eq("school_id", schoolId)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    instructorEmail = String(existing.email).toLowerCase();
    instructorFirst = String(existing.first_name ?? "");
    instructorLast = String(existing.last_name ?? "");
    expertise = Array.isArray(existing.expertise) ? existing.expertise.map(String) : [];
  } else {
    const { data: dup } = await db
      .from("school_instructors")
      .select("*")
      .eq("school_id", schoolId)
      .ilike("email", email)
      .maybeSingle();

    if (dup) {
      instructorId = String(dup.id);
      await db
        .from("school_instructors")
        .update({
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          status: "invited",
          invited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", instructorId);
      expertise = Array.isArray(dup.expertise) ? dup.expertise.map(String) : [];
    } else {
      if (!firstName || !lastName) {
        return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
      }
      const { data: created, error } = await db
        .from("school_instructors")
        .insert({
          school_id: schoolId,
          email,
          first_name: firstName,
          last_name: lastName,
          status: "invited",
          invited_at: new Date().toISOString(),
          expert_invite_status: "invited",
        })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      instructorId = String(created.id);
    }
  }

  // Token fiche école (complément éventuel) + invitation Expert
  const token = generateInviteToken();
  await db.from("school_instructor_invitations").insert({
    school_id: schoolId,
    instructor_id: instructorId,
    token_hash: hashInviteToken(token),
    expires_at: inviteExpiresAt().toISOString(),
    created_by: session.id,
  });

  const { data: org } = await db.from("organizations").select("name").eq("id", schoolId).maybeSingle();
  const schoolName = String((org as { name?: string } | null)?.name ?? "EDGE");

  const expertInvite = await inviteSchoolInstructorAsExpert(db, {
    instructorId: String(instructorId),
    email: instructorEmail,
    firstName: instructorFirst,
    lastName: instructorLast,
    expertise,
    schoolName,
  });

  if (!expertInvite.ok) {
    return NextResponse.json({ error: expertInvite.error || "EXPERT_INVITE_FAILED" }, { status: 400 });
  }

  return NextResponse.json({
    instructor_id: instructorId,
    expert_id: expertInvite.expertId,
    user_id: expertInvite.userId,
    email_sent: expertInvite.emailSent,
    expert_invite_status: "invited",
    password_setup_link: expertInvite.passwordSetupLink,
  });
}
