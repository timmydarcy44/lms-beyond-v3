import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import {
  clearEmargeSession,
  deviceTokenHash,
  readEmargeSession,
  readOrCreateDeviceToken,
} from "@/lib/formation-attendance/cookies";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";

export async function POST(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  if (!session?.profileId) {
    return NextResponse.json(
      { error: "Identifiez-vous d'abord (e-mail + code).", code: "not_identified" },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const validationMode =
    body?.validation_mode === "confirmation" ? "confirmation" : "signature";
  const identificationMethod =
    body?.identification_method === "passkey" ? "passkey" : "otp";
  const firstActivation = Boolean(body?.first_activation);
  const signatureSvg =
    validationMode === "signature" && body?.signature_svg
      ? String(body.signature_svg)
      : null;

  if (validationMode === "signature" && (!signatureSvg || signatureSvg.length < 20)) {
    return NextResponse.json({ error: "Signature requise" }, { status: 400 });
  }

  const ctx = await loadSlotContext(service, session.slotId);
  if (!ctx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  const participant = ctx.participants.find((p) => p.profile_id === session.profileId);
  if (!participant) {
    return NextResponse.json({ error: "Participant introuvable" }, { status: 404 });
  }
  if (!participant.convention_ok) {
    return NextResponse.json({ error: "Convention non signée", code: "convention_required" }, { status: 403 });
  }

  const { data: existing } = await service
    .from("attendance_signatures")
    .select("id")
    .eq("slot_id", session.slotId)
    .eq("profile_id", session.profileId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Déjà émargé", code: "already_signed" }, { status: 409 });
  }

  // Un device = une signature / créneau (hors appareil formateur)
  const { token: deviceToken } = await readOrCreateDeviceToken();
  const deviceHash = deviceTokenHash(deviceToken);
  const { data: device } = await service
    .from("attendance_devices")
    .upsert(
      {
        device_token_hash: deviceHash,
        profile_id: session.profileId,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "device_token_hash" },
    )
    .select("id")
    .single();

  if (device?.id) {
    const { data: deviceDup } = await service
      .from("attendance_signatures")
      .select("id, profile_id")
      .eq("slot_id", session.slotId)
      .eq("device_id", device.id)
      .maybeSingle();
    if (deviceDup && String(deviceDup.profile_id) !== session.profileId) {
      return NextResponse.json(
        {
          error: "Cet appareil a déjà été utilisé pour un autre participant sur ce créneau.",
          code: "device_reuse",
        },
        { status: 409 },
      );
    }
  }

  const delayMs = Math.max(0, Date.now() - (session.exp - 3 * 60 * 1000));
  const alerts: string[] = [];
  if (delayMs > 2 * 60 * 1000) alerts.push("scan_to_sign_gt_2min");

  // Alerte légère : OTP alors qu'une passkey existe
  if (identificationMethod === "otp") {
    const { count } = await service
      .from("attendance_credentials")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", session.profileId)
      .is("revoked_at", null);
    if (count && count > 0) alerts.push("otp_while_passkey_exists");
  }

  const credentialDbId = body?.credential_db_id ? String(body.credential_db_id) : null;
  if (credentialDbId) {
    const { data: cred } = await service
      .from("attendance_credentials")
      .select("synced, backed_up")
      .eq("id", credentialDbId)
      .maybeSingle();
    if (cred?.synced || cred?.backed_up) alerts.push("passkey_synced");
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const { data: signature, error } = await service
    .from("attendance_signatures")
    .insert({
      slot_id: session.slotId,
      profile_id: session.profileId,
      signature_svg: signatureSvg,
      ip,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      device_id: device?.id ?? null,
      credential_id: credentialDbId,
      launch_id: session.launchId,
      token_counter: session.counter,
      delay_ms: delayMs,
      source: session.source,
      identification_method: identificationMethod,
      validation_mode: validationMode,
      arrived_at: new Date().toISOString(),
      first_activation: firstActivation,
      status: "ok",
      alerts,
    })
    .select("*")
    .single();

  if (error || !signature) {
    return NextResponse.json({ error: error?.message || "Enregistrement impossible" }, { status: 400 });
  }

  const dayPartLabel = ctx.slot.day_part === "matin" ? "matin" : "après-midi";

  // Lot 6 — proposer le positionnement s'il n'est pas fait
  let positionnementUrl: string | null = null;
  try {
    const { data: partRow } = await service
      .from("formation_participants")
      .select("id")
      .eq("dossier_id", participant.dossier_id)
      .eq("profile_id", participant.profile_id)
      .maybeSingle();
    const { ensureAssessmentAttempt, assessmentUrl } = await import(
      "@/lib/formation-assessments/ensure"
    );
    const attempt = await ensureAssessmentAttempt(service, {
      dossierId: participant.dossier_id,
      kind: "positionnement",
      participantId: partRow?.id ? String(partRow.id) : null,
      profileId: participant.profile_id,
    });
    if (attempt.status !== "completed") {
      positionnementUrl = assessmentUrl(attempt.access_token);
    }
  } catch {
    /* non-bloquant */
  }

  await sendEmail({
    to: participant.email,
    from: EDGE_COCKPIT_FROM,
    subject: "Présence enregistrée — Byound",
    html: buildEdgeEmailShell({
      title: "Présence enregistrée",
      preheader: `${participant.name} · ${dayPartLabel}`,
      bodyHtml: `<p style="margin:0 0 12px;font-size:15px;color:#4A4A4A;">Bonjour ${escapeEdgeEmailHtml(participant.name)},</p>
<p style="margin:0 0 12px;font-size:15px;color:#4A4A4A;">Votre présence a été enregistrée pour la demi-journée du ${escapeEdgeEmailHtml(ctx.slot.slot_date)} (${escapeEdgeEmailHtml(dayPartLabel)}).</p>
${
  positionnementUrl
    ? `<p style="margin:0;font-size:15px;color:#4A4A4A;">Si ce n'est pas encore fait, complétez votre test de positionnement.</p>`
    : ""
}`,
      cta: positionnementUrl
        ? { label: "Commencer le test", href: positionnementUrl }
        : undefined,
    }),
    tags: { type: "attendance-recap", slot_id: session.slotId },
  });

  await clearEmargeSession();

  // Prochain créneau
  const { data: nextSlots } = await service
    .from("formation_slots")
    .select("slot_date, day_part, starts_at")
    .eq("session_id", ctx.session.id)
    .gt("slot_date", ctx.slot.slot_date)
    .order("slot_date", { ascending: true })
    .limit(1);

  let nextLabel: string | null = null;
  if (ctx.slot.day_part === "matin") {
    nextLabel = "après-midi";
  } else if (nextSlots?.[0]) {
    nextLabel = `${nextSlots[0].slot_date} · ${nextSlots[0].day_part}`;
  }

  return NextResponse.json({
    ok: true,
    signature: {
      id: signature.id,
      signed_at: signature.server_timestamp,
      name: participant.name,
    },
    next_slot_label: nextLabel,
    positionnement_url: positionnementUrl,
  });
}
