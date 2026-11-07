import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import {
  ATTENDANCE_MAX_OTP_ATTEMPTS,
  ATTENDANCE_OTP_TTL_MS,
  hashToken,
  newOtpCode,
} from "@/lib/formation-attendance/token";
import {
  buildEmargeSession,
  readEmargeSession,
  setEmargeSession,
} from "@/lib/formation-attendance/cookies";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";

export async function POST(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  if (!session) {
    return NextResponse.json(
      { error: "Session d'émargement expirée. Saisissez à nouveau le code salle.", code: "session_expired" },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "request").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();

  const ctx = await loadSlotContext(service, session.slotId);
  if (!ctx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  if (action === "request") {
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    const participant = ctx.participants.find((p) => p.email === email);
    if (!participant) {
      return NextResponse.json(
        { error: "Cet e-mail n'est pas inscrit à ce créneau. Prévenez le formateur.", code: "not_enrolled" },
        { status: 404 },
      );
    }
    if (!participant.convention_ok) {
      return NextResponse.json(
        {
          error: "Convention non signée pour votre entreprise — émargement non autorisé.",
          code: "convention_required",
        },
        { status: 403 },
      );
    }

    const { data: existingSig } = await service
      .from("attendance_signatures")
      .select("id")
      .eq("slot_id", session.slotId)
      .eq("profile_id", participant.profile_id)
      .maybeSingle();
    if (existingSig) {
      return NextResponse.json(
        { error: "Présence déjà enregistrée pour ce créneau.", code: "already_signed" },
        { status: 409 },
      );
    }

    const otp = newOtpCode();
    await service.from("attendance_otps").insert({
      slot_id: session.slotId,
      profile_id: participant.profile_id,
      code_hash: hashToken(otp),
      expires_at: new Date(Date.now() + ATTENDANCE_OTP_TTL_MS).toISOString(),
    });

    const html = buildEdgeEmailShell({
      title: "Code d'émargement Byound",
      preheader: `Votre code : ${otp}`,
      bodyHtml: `<p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;">Bonjour ${escapeEdgeEmailHtml(participant.name)},</p>
<p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;">Voici votre code pour émarger :</p>
<p style="margin:0;font-size:32px;font-weight:700;letter-spacing:6px;color:#111;">${escapeEdgeEmailHtml(otp)}</p>
<p style="margin:16px 0 0;font-size:13px;color:#8A8A8A;">Valable 10 minutes. Ne le partagez pas.</p>`,
    });

    await sendEmail({
      to: email,
      from: EDGE_COCKPIT_FROM,
      subject: `Code émargement Byound — ${otp}`,
      html,
      tags: { type: "attendance-otp", slot_id: session.slotId },
    });

    return NextResponse.json({ ok: true, sent: true });
  }

  if (action === "verify") {
    const otpCode = String(body?.otp ?? "").replace(/\D/g, "");
    if (!email.includes("@") || otpCode.length !== 6) {
      return NextResponse.json({ error: "Email et code à 6 chiffres requis" }, { status: 400 });
    }
    const participant = ctx.participants.find((p) => p.email === email);
    if (!participant) {
      return NextResponse.json({ error: "Email non inscrit à ce créneau", code: "not_enrolled" }, { status: 404 });
    }

    const { data: otpRow } = await service
      .from("attendance_otps")
      .select("*")
      .eq("slot_id", session.slotId)
      .eq("profile_id", participant.profile_id)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json({ error: "Aucun code en cours. Demandez-en un nouveau." }, { status: 400 });
    }
    if (Date.parse(String(otpRow.expires_at)) < Date.now()) {
      return NextResponse.json({ error: "Code expiré.", code: "otp_expired" }, { status: 400 });
    }
    if (Number(otpRow.attempts) >= ATTENDANCE_MAX_OTP_ATTEMPTS) {
      return NextResponse.json({ error: "Trop de tentatives OTP.", code: "otp_locked" }, { status: 429 });
    }

    const ok = hashToken(otpCode) === String(otpRow.code_hash);
    if (!ok) {
      await service
        .from("attendance_otps")
        .update({ attempts: Number(otpRow.attempts) + 1 })
        .eq("id", otpRow.id);
      return NextResponse.json({ error: "Code incorrect.", code: "otp_invalid" }, { status: 400 });
    }

    await service
      .from("attendance_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    await setEmargeSession(
      buildEmargeSession({
        launchId: session.launchId,
        slotId: session.slotId,
        counter: session.counter,
        source: session.source,
        profileId: participant.profile_id,
      }),
    );

    return NextResponse.json({
      ok: true,
      profile_id: participant.profile_id,
      name: participant.name,
      validation_pref: "signature",
    });
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 });
}
