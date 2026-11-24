import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

/**
 * Enregistre une relance dans le suivi (+ e-mail optionnel via Resend).
 * testOnly=true (défaut) : refuse l’e-mail si le destinataire n’est pas un compte de test.
 */
export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    learnerId?: string;
    subject?: string;
    body?: string;
    courseId?: string | null;
    leafTitle?: string | null;
    testOnly?: boolean;
    sendEmail?: boolean;
    kind?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const learnerId = body.learnerId?.trim();
  if (!learnerId) return NextResponse.json({ error: "learnerId required" }, { status: 400 });

  const db = (await getServiceRoleClientOrFallback()) ?? supabase;

  const { data: learner } = await db
    .from("profiles")
    .select("id, email, first_name, role, is_test")
    .eq("id", learnerId)
    .maybeSingle();

  if (!learner) return NextResponse.json({ error: "Apprenant introuvable" }, { status: 404 });

  const testOnly = body.testOnly !== false;
  const isTest =
    (learner as { is_test?: boolean }).is_test === true ||
    looksLikeTestAccount({
      email: (learner as { email?: string }).email,
      role: (learner as { role?: string }).role,
    });

  if (testOnly && !isTest && body.sendEmail) {
    return NextResponse.json(
      {
        error:
          "Relance e-mail bloquée : destinataire hors compte de test. Désactivez testOnly uniquement pour un envoi réel validé.",
        logged: false,
      },
      { status: 403 },
    );
  }

  const subject = body.subject ?? "On continue ?";
  const kind = body.kind ?? "email_manuel";
  let emailed = false;

  if (body.sendEmail && learner.email) {
    if (testOnly && !isTest) {
      // journal only
    } else {
      const text =
        body.body?.trim() ||
        `Bonjour ${learner.first_name || ""},\n\nOn reprend ta formation dès que tu es prêt·e.\n\nL’équipe Byound`;
      const html = buildEdgeEmailShell({
        preheader: subject,
        title: escapeEdgeEmailHtml(subject),
        bodyHtml: `<p style="white-space:pre-wrap">${escapeEdgeEmailHtml(text)}</p>`,
      });
      const sent = await sendEmail({
        from: EDGE_COCKPIT_FROM,
        to: String(learner.email),
        subject,
        html,
        text,
        tags: { type: "lms-relance", learner_id: learnerId },
      });
      emailed = Boolean(sent.success);
    }
  }

  const insertPayload: Record<string, unknown> = {
    learner_id: learnerId,
    sent_by: user.id,
    subject,
    course_id: body.courseId ?? null,
    leaf_title: body.leafTitle ?? null,
    channel: "email",
    kind,
    status: "envoye",
  };

  let insert = await db.from("learner_relances").insert(insertPayload);
  if (insert.error && /kind|status|column|schema cache/i.test(insert.error.message)) {
    insert = await db.from("learner_relances").insert({
      learner_id: learnerId,
      sent_by: user.id,
      subject,
      course_id: body.courseId ?? null,
      leaf_title: body.leafTitle ?? null,
      channel: "email",
    });
  }

  if (insert.error && /schema cache|does not exist|relation/i.test(insert.error.message)) {
    return NextResponse.json({ ok: true, logged: false, pendingMigration: true, emailed });
  }
  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, logged: true, emailed });
}
