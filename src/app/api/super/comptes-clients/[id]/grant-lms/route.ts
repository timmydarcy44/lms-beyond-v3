import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildActivityRow } from "@/lib/control/policy";
import { grantLmsCourseToOrganization } from "@/lib/org/org-formations";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { courseId?: string };
  const courseId = String(body.courseId ?? "").trim();
  if (!courseId) return NextResponse.json({ error: "courseId requis" }, { status: 400 });

  const course = await service
    .from("courses")
    .select("id, title, builder_snapshot")
    .eq("id", courseId)
    .maybeSingle();
  if (!course.data) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  const publisher = (course.data.builder_snapshot as { general?: { publisher?: string } } | null)?.general?.publisher;
  if (publisher !== "byound") {
    return NextResponse.json(
      { error: "Seules les formations LMS Byound peuvent être mises à disposition" },
      { status: 400 },
    );
  }

  const granted = await grantLmsCourseToOrganization(orgId, courseId, {
    grantedBy: data.user.id,
    source: "compte_client",
  });
  if (!granted.ok) {
    return NextResponse.json({ error: granted.error || "Grant impossible" }, { status: 400 });
  }

  await service.from("org_activity").insert(
    buildActivityRow({
      orgId,
      actorUserId: data.user.id,
      actorType: "byound_on_behalf",
      action: "grant_lms_course",
      payload: { courseId, title: course.data.title },
    }),
  );

  return NextResponse.json({ ok: true });
}
