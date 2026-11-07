import { NextRequest, NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/browser";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  buildEmargeSession,
  readEmargeSession,
  setEmargeSession,
} from "@/lib/formation-attendance/cookies";
import {
  buildAuthenticationOptions,
  verifyAuthentication,
} from "@/lib/formation-attendance/webauthn";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";

export async function GET(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  if (!session) {
    return NextResponse.json({ error: "Session salle expirée", code: "session_expired" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "";
  let profileId = session.profileId ?? null;

  if (!profileId && email) {
    const ctx = await loadSlotContext(service, session.slotId);
    const participant = ctx?.participants.find((p) => p.email === email);
    if (!participant) {
      return NextResponse.json({ error: "Email non inscrit", code: "not_enrolled" }, { status: 404 });
    }
    if (!participant.convention_ok) {
      return NextResponse.json({ error: "Convention non signée", code: "convention_required" }, { status: 403 });
    }
    profileId = participant.profile_id;
  }

  if (!profileId) {
    return NextResponse.json({ error: "Email requis pour retrouver la passkey" }, { status: 400 });
  }

  const { data: profile } = await service
    .from("profiles")
    .select("attendance_prefer_otp")
    .eq("id", profileId)
    .maybeSingle();
  if (profile?.attendance_prefer_otp) {
    return NextResponse.json({ error: "OTP systématique activé", code: "prefer_otp" }, { status: 409 });
  }

  const { data: creds } = await service
    .from("attendance_credentials")
    .select("credential_id")
    .eq("profile_id", profileId)
    .is("revoked_at", null);

  if (!creds?.length) {
    return NextResponse.json({ error: "Aucune passkey", code: "no_passkey" }, { status: 404 });
  }

  const options = await buildAuthenticationOptions({
    allowCredentialIds: creds.map((c) => String(c.credential_id)),
    requestUrl: req.url,
  });

  await service.from("attendance_webauthn_challenges").insert({
    profile_id: profileId,
    slot_id: session.slotId,
    purpose: "authentication",
    challenge: options.challenge,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });

  // Mémorise le profil candidat dans la session salle (sans marquer comme identifié tant que non vérifié)
  await setEmargeSession(
    buildEmargeSession({
      launchId: session.launchId,
      slotId: session.slotId,
      counter: session.counter,
      source: session.source,
      profileId: undefined,
    }),
  );

  // Stocker profile candidat via challenge déjà lié
  return NextResponse.json({ options, profile_id: profileId });
}

export async function POST(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  if (!session) {
    return NextResponse.json({ error: "Session salle expirée", code: "session_expired" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    response?: AuthenticationResponseJSON;
    profile_id?: string;
  } | null;
  if (!body?.response || !body.profile_id) {
    return NextResponse.json({ error: "Réponse WebAuthn manquante" }, { status: 400 });
  }

  const profileId = String(body.profile_id);
  const credentialId = String(body.response.id);

  const { data: cred } = await service
    .from("attendance_credentials")
    .select("*")
    .eq("profile_id", profileId)
    .eq("credential_id", credentialId)
    .is("revoked_at", null)
    .maybeSingle();

  if (!cred) {
    return NextResponse.json({ error: "Passkey inconnue ou révoquée" }, { status: 404 });
  }

  const { data: challengeRow } = await service
    .from("attendance_webauthn_challenges")
    .select("*")
    .eq("profile_id", profileId)
    .eq("purpose", "authentication")
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challengeRow || Date.parse(String(challengeRow.expires_at)) < Date.now()) {
    return NextResponse.json({ error: "Challenge expiré" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthentication({
      response: body.response,
      expectedChallenge: String(challengeRow.challenge),
      credential: {
        id: String(cred.id),
        credentialId: String(cred.credential_id),
        publicKey: String(cred.public_key),
        signCount: Number(cred.sign_count ?? 0),
        transports: cred.transports as string[] | null,
        backedUp: Boolean(cred.backed_up ?? cred.synced),
      },
      requestUrl: req.url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Authentification échouée" },
      { status: 400 },
    );
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Authentification refusée" }, { status: 400 });
  }

  await service
    .from("attendance_webauthn_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challengeRow.id);

  await service
    .from("attendance_credentials")
    .update({
      sign_count: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", cred.id);

  const ctx = await loadSlotContext(service, session.slotId);
  const participant = ctx?.participants.find((p) => p.profile_id === profileId);

  await setEmargeSession(
    buildEmargeSession({
      launchId: session.launchId,
      slotId: session.slotId,
      counter: session.counter,
      source: session.source,
      profileId,
    }),
  );

  return NextResponse.json({
    ok: true,
    profile_id: profileId,
    name: participant?.name ?? "",
    credential_db_id: cred.id,
    synced: Boolean(cred.synced || cred.backed_up),
  });
}
