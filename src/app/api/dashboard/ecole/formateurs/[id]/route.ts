import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { parseStringList } from "@/lib/ecole/instructors";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

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
    .from("school_instructors")
    .select("*")
    .eq("school_id", schoolId)
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const { data: slots } = await db
    .from("school_planning_slots")
    .select("id, duration_hours, starts_at, ends_at, module_id, class_id, status")
    .eq("school_id", schoolId)
    .eq("instructor_id", id)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: false })
    .limit(50);

  const hours = (slots ?? []).reduce(
    (a: number, s: { duration_hours?: number }) => a + Number(s.duration_hours ?? 0),
    0,
  );

  return NextResponse.json({
    instructor: { ...data, hours_assigned: Math.round(hours * 100) / 100 },
    recent_slots: slots ?? [],
  });
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

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const strFields = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "photo_url",
    "address",
    "job_title",
    "company",
    "bio",
    "linkedin_url",
    "pedagogical_experience",
    "internal_notes",
    "status",
  ] as const;
  for (const key of strFields) {
    if (body[key] !== undefined) {
      if (key === "email") patch.email = String(body.email).trim().toLowerCase();
      else if (key === "status") {
        const s = String(body.status);
        if (["active", "invited", "incomplete", "inactive"].includes(s)) patch.status = s;
        if (s === "active") patch.activated_at = new Date().toISOString();
      } else patch[key] = body[key] === null ? null : String(body[key]);
    }
  }
  if (body.expertise !== undefined) patch.expertise = parseStringList(body.expertise);
  if (body.teachable_subjects !== undefined) {
    patch.teachable_subjects = parseStringList(body.teachable_subjects);
  }
  if (body.levels !== undefined) patch.levels = parseStringList(body.levels);
  if (body.availability !== undefined && typeof body.availability === "object") {
    patch.availability = body.availability;
  }

  const { data, error } = await db
    .from("school_instructors")
    .update(patch)
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ instructor: data });
}
