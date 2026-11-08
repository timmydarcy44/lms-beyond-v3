import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildActivityRow } from "@/lib/control/policy";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { courseId?: string; userIds?: string[]; action?: string };
  const courseId = String(body.courseId ?? "");
  if (body.action === "remove") {
    if (!courseId) return NextResponse.json({ error: "Formation introuvable" }, { status: 400 });
    const members = await service.from("org_memberships").select("user_id").eq("org_id", id);
    const memberIds = ((members.data ?? []) as Array<{ user_id: string }>).map((member) => member.user_id);
    if (memberIds.length) {
      await service.from("enrollments").delete().eq("course_id", courseId).in("user_id", memberIds);
    }
    await service.from("org_activity").insert(buildActivityRow({
      orgId: id,
      actorUserId: data.user.id,
      actorType: "byound_on_behalf",
      action: "unassign_course",
      payload: { courseId },
    }));
    return NextResponse.json({ ok: true });
  }
  const userIds = (body.userIds ?? []).filter((userId) => !userId.startsWith("employee:"));
  if (!courseId || userIds.length === 0) {
    return NextResponse.json({ error: "Choisissez une formation et au moins un participant." }, { status: 400 });
  }
  const course = await service.from("courses").select("id, title").eq("id", courseId).maybeSingle();
  if (!course.data) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  const { grantLmsCourseToOrganization } = await import("@/lib/org/org-formations");
  await grantLmsCourseToOrganization(id, courseId, {
    grantedBy: data.user.id,
    source: "assign_members",
  });
  let created = 0;
  for (const userId of userIds) {
    const inserted = await service.from("enrollments").insert({ user_id: userId, course_id: courseId, role: "learner" });
    if (!inserted.error) created += 1;
  }
  await service.from("org_activity").insert(buildActivityRow({
    orgId: id,
    actorUserId: data.user.id,
    actorType: "byound_on_behalf",
    action: "assign_course",
    payload: { courseId, title: course.data.title, created },
  }));
  return NextResponse.json({ ok: true, created });
}
