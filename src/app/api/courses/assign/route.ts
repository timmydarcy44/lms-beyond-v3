import { NextResponse } from "next/server";
import { listOrgLearners, userCanManageOrgFormations } from "@/lib/org/org-formations";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type Body = {
  courseId: string;
  groupIds?: string[];
  orgId?: string;
  learnerIds?: string[];
  userId?: string;
  userIds?: string[];
  learnerEmail?: string;
  /** Restrict targets to members of orgId / course.org_id */
  scopeOrgOnly?: boolean;
};

function uniqStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((v) => (v ? String(v) : "")).filter(Boolean)));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase non configuré" }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "Payload invalide" }, { status: 400 });
  }

  const courseId = String(body.courseId ?? "").trim();
  if (!courseId) return NextResponse.json({ success: false, error: "courseId requis" }, { status: 400 });
  if (!isUuid(courseId)) return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  const service = await getServiceRoleClientOrFallback();
  const readClient = service ?? supabase;

  const { data: course, error: courseError } = await readClient
    .from("courses")
    .select("id, owner_id, creator_id, org_id")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) return NextResponse.json({ success: false, error: "Formation introuvable" }, { status: 404 });

  const courseOrgId = String((course as { org_id?: string | null }).org_id ?? "").trim() || null;
  const isOwner =
    String(course.owner_id ?? "") === user.id || String(course.creator_id ?? "") === user.id;
  const canManageOrg = courseOrgId
    ? await userCanManageOrgFormations(readClient, user.id, courseOrgId)
    : false;
  if (!isOwner && !canManageOrg) {
    return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 });
  }

  const scopeOrgId =
    (typeof body.orgId === "string" && body.orgId.trim() ? body.orgId.trim() : null) || courseOrgId;
  const scopeOrgOnly = Boolean(body.scopeOrgOnly) || Boolean(courseOrgId);

  if (scopeOrgOnly && scopeOrgId && courseOrgId && scopeOrgId !== courseOrgId) {
    return NextResponse.json(
      { success: false, error: "Cette formation est réservée à son organisation." },
      { status: 403 },
    );
  }

  const targetUserIds = new Set<string>();

  if (!scopeOrgOnly) {
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds.map(String).filter(Boolean) : [];
    if (groupIds.length) {
      const { data: members, error } = await supabase
        .from("group_members")
        .select("user_id, group_id")
        .in("group_id", groupIds);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      (members ?? []).forEach((m: { user_id?: string }) => {
        if (m?.user_id) targetUserIds.add(String(m.user_id));
      });
    }
  }

  const orgId = typeof body.orgId === "string" && body.orgId.trim() ? body.orgId.trim() : null;
  if (orgId && !scopeOrgOnly) {
    const { data: orgMembers, error } = await supabase
      .from("org_memberships")
      .select("user_id, role")
      .eq("org_id", orgId)
      .eq("role", "learner");
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    (orgMembers ?? []).forEach((m: { user_id?: string }) => {
      if (m?.user_id) targetUserIds.add(String(m.user_id));
    });
  }

  const learnerIds = Array.isArray(body.learnerIds) ? uniqStrings(body.learnerIds) : [];
  learnerIds.forEach((id) => targetUserIds.add(id));

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (userId) targetUserIds.add(userId);
  const userIdsFromBody = Array.isArray(body.userIds) ? uniqStrings(body.userIds) : [];
  userIdsFromBody.forEach((id) => targetUserIds.add(id));

  if (!scopeOrgOnly) {
    const learnerEmail = typeof body.learnerEmail === "string" ? body.learnerEmail.trim() : "";
    if (learnerEmail) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", learnerEmail)
        .maybeSingle();
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      if (!profile?.id) return NextResponse.json({ success: false, error: "Apprenant introuvable" }, { status: 404 });
      targetUserIds.add(String(profile.id));
    }
  }

  let userIds = Array.from(targetUserIds);
  if (userIds.length === 0) {
    return NextResponse.json({ success: false, error: "Aucune cible sélectionnée" }, { status: 400 });
  }
  const invalidUserId = userIds.find((id) => !isUuid(String(id)));
  if (invalidUserId) return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  if (scopeOrgOnly && scopeOrgId) {
    const allowed = new Set((await listOrgLearners(scopeOrgId)).map((l) => l.id));
    userIds = userIds.filter((id) => allowed.has(id));
    if (!userIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun membre de votre organisation dans la sélection.",
        },
        { status: 400 },
      );
    }
  }

  const rows = userIds.map((uid) => ({
    course_id: courseId,
    user_id: uid,
  }));

  const writeClient = service ?? supabase;
  const result = await writeClient.from("enrollments").upsert(rows as never, { onConflict: "user_id,course_id" });

  if (result.error) {
    const courseEnrollments = userIds.map((uid) => ({
      course_id: courseId,
      user_id: uid,
    }));
    let alt = await writeClient
      .from("course_enrollments")
      .upsert(courseEnrollments as never, { onConflict: "user_id,course_id" });
    if (alt.error) {
      alt = await writeClient.from("course_enrollments").insert(courseEnrollments as never);
    }
    if (!alt.error) {
      return NextResponse.json({
        success: true,
        count: userIds.length,
        message: `${userIds.length} apprenant(s) assigné(s) à la formation.`,
      });
    }
    const code = (result.error as { code?: string })?.code ? String((result.error as { code?: string }).code) : "";
    const msg = code === "42501" ? "Erreur de permissions (RLS)" : result.error.message;
    return NextResponse.json({ success: false, error: msg, code }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    count: userIds.length,
    message: `${userIds.length} apprenant(s) assigné(s) à la formation.`,
  });
}
