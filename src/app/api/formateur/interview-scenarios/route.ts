import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { formatSituationIssues, situationFileSchema } from "@/lib/interview/situation-schema";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const AUTHOR_ROLES = ["instructor", "formateur", "admin", "tutor", "super_admin", "owner", "staff"];

export async function POST(request: Request) {
  const supabase = await getServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = auth?.user?.id;
  if (!userId || !supabase) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  if (!(await isSuperAdmin())) {
    const { data } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("user_id", userId)
      .in("role", AUTHOR_ROLES)
      .limit(1);
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const profileRole = String((profile as { role?: string } | null)?.role ?? "");
    if (!data?.length && !AUTHOR_ROLES.includes(profileRole)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => null);
  const blockId = String(body?.blockId ?? "").trim();
  if (!blockId) return NextResponse.json({ error: "blockId requis" }, { status: 400 });
  const parsed = situationFileSchema.safeParse(body?.scenario);
  if (!parsed.success) {
    return NextResponse.json({ error: formatSituationIssues(parsed.error) }, { status: 400 });
  }

  const db = getServiceRoleClient() ?? supabase;
  const { error } = await db.from("experiential_interview_scenarios").upsert(
    {
      block_id: blockId,
      course_id: body?.courseId ? String(body.courseId) : null,
      created_by: userId,
      scenario: parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "block_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, blockId });
}
