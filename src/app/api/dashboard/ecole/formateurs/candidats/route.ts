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

  const { data, error } = await db
    .from("school_instructor_candidates")
    .select("*")
    .eq("school_id", schoolId)
    .order("applied_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ candidates: data ?? [] });
}

export async function POST(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const firstName = String(body.first_name ?? "").trim();
  const lastName = String(body.last_name ?? "").trim();
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  const { data, error } = await db
    .from("school_instructor_candidates")
    .insert({
      school_id: schoolId,
      first_name: firstName,
      last_name: lastName,
      email: body.email ? String(body.email).trim().toLowerCase() : null,
      phone: body.phone ? String(body.phone) : null,
      expertise: parseStringList(body.expertise),
      availability: body.availability ? String(body.availability) : null,
      experience: body.experience ? String(body.experience) : null,
      cv_url: body.cv_url ? String(body.cv_url) : null,
      status: "new",
      internal_notes: body.internal_notes ? String(body.internal_notes) : null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ candidate: data });
}
