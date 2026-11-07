import { NextRequest, NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/browser";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { readEmargeSession } from "@/lib/formation-attendance/cookies";
import {
  buildRegistrationOptions,
  originFromRequest,
  uint8ToBase64Url,
  verifyRegistration,
} from "@/lib/formation-attendance/webauthn";
import { isAttendanceWindowOpen, loadSlotContext } from "@/lib/formation-attendance/slot-context";

/** Options d'enregistrement — uniquement pendant créneau ouvert + session OTP. */
export async function GET(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  if (!session?.profileId) {
    return NextResponse.json({ error: "Identifiez-vous d'abord", code: "not_identified" }, { status: 401 });
  }

  const ctx = await loadSlotContext(service, session.slotId);
  if (!ctx || !isAttendanceWindowOpen(ctx.slot)) {
    return NextResponse.json(
      { error: "Activation passkey uniquement pendant un créneau d'émargement ouvert." },
      { status: 403 },
    );
  }

  const { data: launch } = await service
    .from("attendance_slot_launches")
    .select("id")
    .eq("id", session.launchId)
    .is("revoked_at", null)
    .maybeSingle();
  if (!launch) {
    return NextResponse.json({ error: "Émargement non lancé / jeton salle invalide" }, { status: 403 });
  }

  const { data: profile } = await service
    .from("profiles")
    .select("id, email, reference_email, full_name, first_name, last_name")
    .eq("id", session.profileId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const { data: existing } = await service
    .from("attendance_credentials")
    .select("credential_id")
    .eq("profile_id", session.profileId)
    .is("revoked_at", null);

  const options = await buildRegistrationOptions({
    profileId: session.profileId,
    userName: String(profile.reference_email || profile.email || session.profileId),
    userDisplayName:
      String(profile.full_name ?? "").trim() ||
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      "Apprenant",
    existingCredentialIds: (existing ?? []).map((c) => String(c.credential_id)),
    requestUrl: originFromRequest(req),
  });

  await service.from("attendance_webauthn_challenges").insert({
    profile_id: session.profileId,
    slot_id: session.slotId,
    purpose: "registration",
    challenge: options.challenge,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });

  return NextResponse.json({ options });
}

export async function POST(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  if (!session?.profileId) {
    return NextResponse.json({ error: "Identifiez-vous d'abord", code: "not_identified" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    response?: RegistrationResponseJSON;
  } | null;
  if (!body?.response) return NextResponse.json({ error: "Réponse WebAuthn manquante" }, { status: 400 });

  const { data: challengeRow } = await service
    .from("attendance_webauthn_challenges")
    .select("*")
    .eq("profile_id", session.profileId)
    .eq("purpose", "registration")
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challengeRow || Date.parse(String(challengeRow.expires_at)) < Date.now()) {
    return NextResponse.json({ error: "Challenge expiré" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistration({
      response: body.response,
      expectedChallenge: String(challengeRow.challenge),
      requestUrl: originFromRequest(req),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Vérification échouée" },
      { status: 400 },
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Enregistrement refusé" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await service
    .from("attendance_webauthn_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challengeRow.id);

  const { data: saved, error } = await service
    .from("attendance_credentials")
    .insert({
      profile_id: session.profileId,
      credential_id: credential.id,
      public_key: uint8ToBase64Url(credential.publicKey),
      sign_count: credential.counter,
      transports: credential.transports ?? [],
      device_type: credentialDeviceType ?? null,
      backed_up: Boolean(credentialBackedUp),
      synced: Boolean(credentialBackedUp),
      created_during_slot_id: session.slotId,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await service
    .from("profiles")
    .update({
      attendance_passkey_prompt: "enabled",
      attendance_method_pref: "passkey",
    })
    .eq("id", session.profileId);

  return NextResponse.json({
    ok: true,
    credential_id: saved.id,
    first_activation: true,
    synced: Boolean(saved.synced),
  });
}
