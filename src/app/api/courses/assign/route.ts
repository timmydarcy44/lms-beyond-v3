import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

type Body = {
  courseId: string;
  groupIds?: string[];
  orgId?: string;
  learnerIds?: string[];
  userId?: string;
  userIds?: string[];
  learnerEmail?: string; // legacy
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

  console.log("PAYLOAD REÇU:", body);

  const courseId = String(body.courseId ?? "").trim();
  if (!courseId) return NextResponse.json({ success: false, error: "courseId requis" }, { status: 400 });
  if (!isUuid(courseId)) return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  // Vérifier que le cours appartient au formateur (owner_id ou creator_id).
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, owner_id, creator_id")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) return NextResponse.json({ success: false, error: "Formation introuvable" }, { status: 404 });
  const isOwner = String(course.owner_id ?? "") === user.id || String(course.creator_id ?? "") === user.id;
  if (!isOwner) return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 });

  const targetUserIds = new Set<string>();

  // Groupes → group_members.user_id
  const groupIds = Array.isArray(body.groupIds) ? body.groupIds.map(String).filter(Boolean) : [];
  if (groupIds.length) {
    const { data: members, error } = await supabase
      .from("group_members")
      .select("user_id, group_id")
      .in("group_id", groupIds);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    (members ?? []).forEach((m: any) => {
      if (m?.user_id) targetUserIds.add(String(m.user_id));
    });
  }

  // Organisation → org_memberships (role learner)
  const orgId = typeof body.orgId === "string" && body.orgId.trim() ? body.orgId.trim() : null;
  if (orgId) {
    const { data: orgMembers, error } = await supabase
      .from("org_memberships")
      .select("user_id, role")
      .eq("org_id", orgId)
      .eq("role", "learner");
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    (orgMembers ?? []).forEach((m: any) => {
      if (m?.user_id) targetUserIds.add(String(m.user_id));
    });
  }

  // Individuel → sélection directe d’IDs
  const learnerIds = Array.isArray(body.learnerIds) ? uniqStrings(body.learnerIds) : [];
  learnerIds.forEach((id) => targetUserIds.add(id));

  // Standard: userId / userIds
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (userId) targetUserIds.add(userId);
  const userIdsFromBody = Array.isArray(body.userIds) ? uniqStrings(body.userIds) : [];
  userIdsFromBody.forEach((id) => targetUserIds.add(id));

  // Legacy (email) → profiles via email
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

  const userIds = Array.from(targetUserIds);
  if (userIds.length === 0) {
    return NextResponse.json({ success: false, error: "Aucune cible sélectionnée" }, { status: 400 });
  }
  const invalidUserId = userIds.find((id) => !isUuid(String(id)));
  if (invalidUserId) return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  const rows = userIds.map((uid) => ({
    course_id: courseId,
    user_id: uid,
  }));

  console.log("Tentative insertion enrollments:", { user_id: userIds[0], course_id: courseId });

  const result = await supabase.from("enrollments").upsert(rows as any, { onConflict: "user_id,course_id" });

  if (result.error) {
    // Fallback: certaines versions utilisent `course_enrollments`
    const courseEnrollments = userIds.map((uid) => ({
      course_id: courseId,
      user_id: uid,
    }));
    let alt = await supabase.from("course_enrollments").upsert(courseEnrollments as any, { onConflict: "user_id,course_id" });
    if (alt.error) {
      alt = await supabase.from("course_enrollments").insert(courseEnrollments as any);
    }
    if (!alt.error) {
      return NextResponse.json({
        success: true,
        count: userIds.length,
        message: `${userIds.length} apprenant(s) assigné(s) à la formation.`,
      });
    }
    const code = (result.error as any)?.code ? String((result.error as any).code) : "";
    const msg = code === "42501" ? "Erreur de permissions (RLS)" : result.error.message;
    return NextResponse.json({ success: false, error: msg, code }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    count: userIds.length,
    message: `${userIds.length} apprenant(s) assigné(s) à la formation.`,
  });
}

