import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, edgeEmailParagraph } from "@/lib/emails/edge-email-shell";
import { appOrigin } from "@/lib/formation-documents/context";
import { computeBpfDraft } from "@/lib/formation-bpf/compute";

export const dynamic = "force-dynamic";

/** Rappel campagne BPF (1er avril + échéance paramétrable). */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Indisponible" }, { status: 503 });

  const today = new Date();
  const isAprilFirst = today.getUTCMonth() === 3 && today.getUTCDate() === 1;

  const { data: ofRow } = await service.from("of_settings").select("*").limit(1).maybeSingle();
  const deadline = ofRow?.bpf_campaign_deadline
    ? String(ofRow.bpf_campaign_deadline).slice(0, 10)
    : null;
  const todayIso = today.toISOString().slice(0, 10);
  const nearDeadline =
    deadline != null &&
    deadline >= todayIso &&
    Date.parse(deadline) - today.getTime() <= 14 * 24 * 60 * 60 * 1000;

  if (!isAprilFirst && !nearDeadline) {
    return NextResponse.json({ ok: true, sent: false, reason: "hors_fenetre" });
  }

  const lastReminder = ofRow?.bpf_last_reminder_at
    ? Date.parse(String(ofRow.bpf_last_reminder_at))
    : 0;
  if (
    !isAprilFirst &&
    lastReminder > 0 &&
    today.getTime() - lastReminder < 6 * 24 * 60 * 60 * 1000
  ) {
    return NextResponse.json({ ok: true, sent: false, reason: "deja_rappelle" });
  }

  const draft = await computeBpfDraft(service);
  const admin = process.env.ADMIN_BCC_EMAIL?.trim() || "timmydarcy44@gmail.com";
  const html = buildEdgeEmailShell({
    title: isAprilFirst ? "Ouverture campagne BPF" : "Échéance BPF proche",
    preheader: `${draft.anomalies.length} anomalie(s) · exercice ${draft.period.start} → ${draft.period.end}`,
    bodyHtml: `${edgeEmailParagraph(
      isAprilFirst
        ? "La campagne BPF est ouverte. Préparez le brouillon Cerfa 10443 dans Byound Control."
        : `L'échéance BPF (${deadline}) approche. Vérifiez le brouillon et les anomalies.`,
    )}${edgeEmailParagraph(
      `Exercice ${draft.period.start} → ${draft.period.end} · ${draft.anomalies.length} anomalie(s) détectée(s).`,
    )}`,
    cta: { label: "Ouvrir le BPF", href: `${appOrigin()}/super/qualite/bpf` },
  });

  const result = await sendEmail({
    to: admin,
    from: EDGE_COCKPIT_FROM,
    subject: isAprilFirst ? "Campagne BPF — Byound" : "Rappel échéance BPF — Byound",
    html,
    tags: { type: "bpf-campaign" },
  });

  if (ofRow?.id) {
    await service
      .from("of_settings")
      .update({ bpf_last_reminder_at: new Date().toISOString() })
      .eq("id", ofRow.id);
  }

  return NextResponse.json({
    ok: true,
    sent: result.success,
    anomalies: draft.anomalies.length,
    error: result.error,
  });
}
