import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { SURMESURE_SELECT } from "@/lib/training-courses/surmesure";
import { buildSurMesurePresentationEmailHtml } from "@/lib/training-courses/surmesure-presentation-mail";
import type { SurMesureCourse } from "@/lib/training-courses/surmesure-ui";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; courseId: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const { id: orgId, courseId } = await context.params;
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    to?: string;
    name?: string;
    message?: string;
  };
  const to = String(body.to ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!to.includes("@")) {
    return NextResponse.json({ error: "E-mail destinataire invalide." }, { status: 400 });
  }

  const [{ data: course, error: courseError }, { data: org }] = await Promise.all([
    service
      .from("training_courses")
      .select(SURMESURE_SELECT)
      .eq("id", courseId)
      .eq("organization_id", orgId)
      .eq("source", "surmesure")
      .maybeSingle(),
    service.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
  ]);

  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

  const organizationName = org?.name || "Compte client";
  const html = buildSurMesurePresentationEmailHtml({
    course: course as SurMesureCourse,
    organizationName,
    recipientName: name || null,
    personalNote: message || null,
  });

  const result = await sendEmail({
    to,
    subject: `Présentation Sur-mesure — ${course.title}`,
    html,
    text: `Présentation de la formation Sur-mesure « ${course.title} » pour ${organizationName}.`,
    tags: {
      type: "surmesure-presentation",
      organization_id: orgId,
      course_id: courseId,
    },
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Envoi impossible" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, messageId: result.messageId, sent_to: to });
}
