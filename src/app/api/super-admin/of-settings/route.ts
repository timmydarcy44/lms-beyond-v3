import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

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
  return NextResponse.json({ settings: data ?? null });
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
  ] as const;

  for (const key of fields) {
    if (body[key] !== undefined) {
      const value = body[key];
      patch[key] = value === null || value === "" ? null : String(value);
    }
  }

  const { data, error } = await service
    .from("of_settings")
    .upsert({ id: OF_SETTINGS_ID, ...patch }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
