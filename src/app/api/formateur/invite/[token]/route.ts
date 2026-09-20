import { NextResponse } from "next/server";

import { hashInviteToken } from "@/lib/ecole/instructor-invite";
import { parseStringList } from "@/lib/ecole/instructors";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

async function loadInvite(token: string) {
  const db = getServiceRoleClient();
  if (!db) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const tokenHash = hashInviteToken(token);
  const { data: invite } = await db
    .from("school_instructor_invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();
  if (!invite) return { error: NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 }) };
  if (invite.accepted_at) {
    return { error: NextResponse.json({ error: "ALREADY_ACCEPTED" }, { status: 410 }) };
  }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: NextResponse.json({ error: "EXPIRED" }, { status: 410 }) };
  }
  const { data: instructor } = await db
    .from("school_instructors")
    .select("*")
    .eq("id", invite.instructor_id)
    .maybeSingle();
  if (!instructor) return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };
  return { db, invite, instructor };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const loaded = await loadInvite(token);
  if ("error" in loaded && loaded.error) return loaded.error;
  const { instructor, invite } = loaded as {
    instructor: Record<string, unknown>;
    invite: { expires_at: string };
  };
  return NextResponse.json({
    instructor: {
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      email: instructor.email,
      phone: instructor.phone,
      photo_url: instructor.photo_url,
      job_title: instructor.job_title,
      company: instructor.company,
      expertise: instructor.expertise,
      teachable_subjects: instructor.teachable_subjects,
      bio: instructor.bio,
      linkedin_url: instructor.linkedin_url,
      pedagogical_experience: instructor.pedagogical_experience,
      levels: instructor.levels,
      availability: instructor.availability,
    },
    expires_at: invite.expires_at,
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const loaded = await loadInvite(token);
  if ("error" in loaded && loaded.error) return loaded.error;
  const { db, invite, instructor } = loaded as {
    db: NonNullable<ReturnType<typeof getServiceRoleClient>>;
    invite: { id: string; instructor_id: string };
    instructor: { id: string };
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    status: "active",
    activated_at: new Date().toISOString(),
  };

  for (const key of [
    "first_name",
    "last_name",
    "phone",
    "photo_url",
    "address",
    "job_title",
    "company",
    "bio",
    "linkedin_url",
    "pedagogical_experience",
  ] as const) {
    if (body[key] !== undefined) patch[key] = body[key] === null ? null : String(body[key]);
  }
  if (body.expertise !== undefined) patch.expertise = parseStringList(body.expertise);
  if (body.teachable_subjects !== undefined) {
    patch.teachable_subjects = parseStringList(body.teachable_subjects);
  }
  if (body.levels !== undefined) patch.levels = parseStringList(body.levels);
  if (body.availability !== undefined && typeof body.availability === "object") {
    patch.availability = body.availability;
  }

  const { error } = await db.from("school_instructors").update(patch).eq("id", instructor.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await db
    .from("school_instructor_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true, status: "active" });
}
