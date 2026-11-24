import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron relances LMS :
 * - 7 j sans activité → e-mail auto (comptes is_test / looksLikeTest uniquement tant que non validé)
 * - 14 j → tâche « Appel conseillé » journalisée
 * Ne traite que profiles.lms_auto_relance_enabled = true (jamais de backfill masse).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const { data: candidates, error } = await db
    .from("profiles")
    .select("id, email, first_name, role, is_test, lms_auto_relance_enabled")
    .eq("lms_auto_relance_enabled", true)
    .limit(200);

  if (error && /lms_auto_relance|column|schema cache/i.test(error.message)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "migration auto-relance non appliquée",
    });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const day7 = now - 7 * 86400000;
  const day14 = now - 14 * 86400000;
  let emailed = 0;
  let calls = 0;
  let skippedReal = 0;

  for (const p of candidates ?? []) {
    const row = p as {
      id: string;
      email?: string | null;
      first_name?: string | null;
      role?: string | null;
      is_test?: boolean | null;
    };
    const isTest =
      row.is_test === true ||
      looksLikeTestAccount({ email: row.email, role: row.role });
    // Garde-fou : pas d’e-mail réel tant que non validé produit.
    if (!isTest) {
      skippedReal += 1;
      continue;
    }

    const { data: lastSession } = await db
      .from("learning_sessions")
      .select("started_at")
      .eq("user_id", row.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastAt = lastSession?.started_at ? Date.parse(String(lastSession.started_at)) : NaN;
    if (!Number.isFinite(lastAt)) continue;

    const { data: recent } = await db
      .from("learner_relances")
      .select("sent_at, kind")
      .eq("learner_id", row.id)
      .gte("sent_at", new Date(now - 7 * 86400000).toISOString())
      .limit(5);

    const hasRecentAuto = (recent ?? []).some((r) => {
      const kind = String((r as { kind?: string }).kind ?? "");
      return kind === "email_auto" || kind === "appel" || !kind;
    });
    if (hasRecentAuto) continue;

    if (lastAt <= day14) {
      await db.from("learner_relances").insert({
        learner_id: row.id,
        subject: "Appel conseillé",
        channel: "call",
        kind: "appel",
        status: "a_venir",
        scheduled_for: new Date().toISOString(),
      });
      calls += 1;
      continue;
    }

    if (lastAt <= day7 && row.email) {
      const subject = `On reprend où tu t’étais arrêté${row.first_name ? "e" : ""} ?`;
      const text = `Bonjour ${row.first_name || ""},\n\nCela fait une semaine sans connexion. Reprends ta formation quand tu veux.\n\nL’équipe Byound`;
      const html = buildEdgeEmailShell({
        title: subject,
        preheader: subject,
        bodyHtml: `<p style="white-space:pre-wrap">${escapeEdgeEmailHtml(text)}</p>`,
      });
      const sent = await sendEmail({
        from: EDGE_COCKPIT_FROM,
        to: String(row.email),
        subject,
        html,
        text,
        tags: { type: "lms-relance-auto", learner_id: row.id },
      });
      await db.from("learner_relances").insert({
        learner_id: row.id,
        subject,
        channel: "email",
        kind: "email_auto",
        status: sent.success ? "envoye" : "envoye",
      });
      if (sent.success) emailed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: (candidates ?? []).length,
    emailed,
    calls,
    skippedReal,
  });
}
