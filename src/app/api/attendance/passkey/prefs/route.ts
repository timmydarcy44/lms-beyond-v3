import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { readEmargeSession } from "@/lib/formation-attendance/cookies";
import { passkeyButtonLabel } from "@/lib/formation-attendance/webauthn";

export async function GET(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "";

  let profileId = session?.profileId ?? null;
  if (!profileId && email && session) {
    const { data: byRef } = await service
      .from("profiles")
      .select("id")
      .ilike("reference_email", email)
      .maybeSingle();
    if (byRef?.id) profileId = String(byRef.id);
    else {
      const { data: byEmail } = await service
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (byEmail?.id) profileId = String(byEmail.id);
    }
  }

  if (!profileId) {
    return NextResponse.json({
      has_passkey: false,
      prompt: null,
      prefer_otp: false,
      validation_pref: "signature",
      button_label: passkeyButtonLabel(req.headers.get("user-agent")),
    });
  }

  const [{ data: profile }, { data: creds }] = await Promise.all([
    service
      .from("profiles")
      .select(
        "attendance_passkey_prompt, attendance_prefer_otp, attendance_validation_pref, attendance_method_pref",
      )
      .eq("id", profileId)
      .maybeSingle(),
    service
      .from("attendance_credentials")
      .select("id, synced, backed_up, revoked_at")
      .eq("profile_id", profileId)
      .is("revoked_at", null),
  ]);

  return NextResponse.json({
    profile_id: profileId,
    has_passkey: (creds ?? []).length > 0,
    prompt: profile?.attendance_passkey_prompt ?? null,
    prefer_otp: Boolean(profile?.attendance_prefer_otp),
    validation_pref: profile?.attendance_validation_pref || "signature",
    method_pref: profile?.attendance_method_pref || null,
    credentials: (creds ?? []).map((c) => ({
      id: c.id,
      synced: Boolean(c.synced || c.backed_up),
    })),
    button_label: passkeyButtonLabel(req.headers.get("user-agent")),
    show_passkey_offer:
      (creds ?? []).length === 0 &&
      (!profile?.attendance_passkey_prompt ||
        profile.attendance_passkey_prompt === "pending" ||
        profile.attendance_passkey_prompt === "later"),
  });
}

export async function PATCH(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  if (!session?.profileId) {
    return NextResponse.json({ error: "Identifiez-vous d'abord" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = {};

  if (body?.passkey_prompt != null) {
    const v = String(body.passkey_prompt);
    if (["later", "declined", "enabled", "pending"].includes(v)) {
      patch.attendance_passkey_prompt = v;
    }
  }
  if (body?.prefer_otp != null) {
    patch.attendance_prefer_otp = Boolean(body.prefer_otp);
    if (body.prefer_otp) patch.attendance_method_pref = "otp";
  }
  if (body?.validation_pref != null) {
    const v = String(body.validation_pref);
    if (["signature", "confirmation", "assistee"].includes(v)) {
      patch.attendance_validation_pref = v;
    }
  }
  if (body?.method_pref != null) {
    const v = String(body.method_pref);
    if (["passkey", "otp", "appareil_formateur"].includes(v)) {
      patch.attendance_method_pref = v;
    }
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const { error } = await service.from("profiles").update(patch).eq("id", session.profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const session = await readEmargeSession();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const credentialId = String(body?.credential_id ?? req.nextUrl.searchParams.get("credential_id") ?? "").trim();

  // Staff revoke OR self revoke with session
  const { isSuperAdmin } = await import("@/lib/auth/super-admin");
  const staff = await isSuperAdmin();

  if (!staff && !session?.profileId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let query = service
    .from("attendance_credentials")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", credentialId);

  if (!staff && session?.profileId) {
    query = query.eq("profile_id", session.profileId);
  }

  const { data, error } = await query.select("id, profile_id").maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Passkey introuvable" }, { status: 400 });
  }

  const { count } = await service
    .from("attendance_credentials")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", data.profile_id)
    .is("revoked_at", null);

  if (!count) {
    await service
      .from("profiles")
      .update({ attendance_passkey_prompt: "declined", attendance_method_pref: "otp" })
      .eq("id", data.profile_id);
  }

  return NextResponse.json({ ok: true });
}
