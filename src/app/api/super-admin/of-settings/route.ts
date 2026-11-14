import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { HANDICAP_REFERENT_CANDIDATES } from "@/lib/handicap/referent-candidates";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

async function resolveHandicapReferentOptions(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
) {
  const options: Array<{
    key: string;
    label: string;
    email: string;
    userId: string | null;
  }> = [];

  for (const candidate of HANDICAP_REFERENT_CANDIDATES) {
    let userId: string | null = null;
    const { data: profile } = await service
      .from("profiles")
      .select("id")
      .ilike("email", candidate.email)
      .maybeSingle();
    if (profile?.id) {
      userId = String(profile.id);
    } else {
      try {
        const listed = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
        const match = listed.data.users.find(
          (u) => u.email?.trim().toLowerCase() === candidate.email,
        );
        userId = match?.id ?? null;
      } catch {
        userId = null;
      }
    }
    options.push({
      key: candidate.key,
      label: candidate.label,
      email: candidate.email,
      userId,
    });
  }

  return options;
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await service
    .from("of_settings")
    .select("*")
    .eq("id", OF_SETTINGS_ID)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const handicapReferentOptions = await resolveHandicapReferentOptions(service);

  const { data: staff } = await service
    .from("super_admins")
    .select("user_id")
    .eq("is_active", true);
  const staffIds = (staff ?? []).map((s) => String(s.user_id));
  const { data: staffProfiles } = staffIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", staffIds)
    : { data: [] as Array<Record<string, unknown>> };
  const staffOptions = (staffProfiles ?? []).map((p) => ({
    userId: String(p.id),
    label:
      String(p.full_name ?? "").trim() ||
      [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
      String(p.email ?? p.id),
    email: String(p.email ?? ""),
  }));

  return NextResponse.json({
    settings: data ?? null,
    handicapReferentOptions,
    staffOptions,
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: actorUserId,
  };

  const fields = [
    "legal_name",
    "nda",
    "siret",
    "siren",
    "vat_intra",
    "address_line",
    "address_city",
    "address_zip",
    "address_country",
    "fiscal_year_start",
    "fiscal_year_end",
    "bpf_campaign_deadline",
    "referent_handicap_user_id",
    "results_indicators_method",
    "referent_qualite_user_id",
    "referent_signalement_user_id",
  ] as const;

  for (const key of fields) {
    if (body[key] !== undefined) {
      const value = body[key];
      patch[key] = value === null || value === "" ? null : String(value);
    }
  }

  for (const key of [
    "lms_inactive_alert_days",
    "reclamation_ack_business_days",
    "reclamation_reply_business_days",
    "signalement_ack_business_days",
  ] as const) {
    if (body[key] !== undefined) {
      const n = Number(body[key]);
      if (Number.isFinite(n) && n >= 1) patch[key] = Math.floor(n);
    }
  }

  if (body.qualiopi_activities !== undefined && body.qualiopi_activities && typeof body.qualiopi_activities === "object") {
    patch.qualiopi_activities = body.qualiopi_activities;
  }
  if (body.qualiopi_audit_type !== undefined) {
    const t = String(body.qualiopi_audit_type);
    if (t === "initial" || t === "surveillance" || t === "renouvellement") {
      patch.qualiopi_audit_type = t;
    }
  }
  if (body.qualiopi_audit_at !== undefined) {
    patch.qualiopi_audit_at =
      body.qualiopi_audit_at === null || body.qualiopi_audit_at === ""
        ? null
        : String(body.qualiopi_audit_at).slice(0, 10);
  }

  let { data, error } = await service
    .from("of_settings")
    .upsert({ id: OF_SETTINGS_ID, ...patch }, { onConflict: "id" })
    .select("*")
    .single();

  if (error && /qualiopi_activities|qualiopi_audit/i.test(error.message)) {
    delete patch.qualiopi_activities;
    delete patch.qualiopi_audit_type;
    delete patch.qualiopi_audit_at;
    ({ data, error } = await service
      .from("of_settings")
      .upsert({ id: OF_SETTINGS_ID, ...patch }, { onConflict: "id" })
      .select("*")
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
