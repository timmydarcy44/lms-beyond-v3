import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { normalizeOrgAddressFields } from "@/lib/control/address-format";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    address_line?: string;
    address_zip?: string;
    address_city?: string;
    address_country?: string;
    siret?: string;
    opco_name?: string | null;
  };

  const normalized = normalizeOrgAddressFields({
    address_line: String(body.address_line ?? ""),
    address_zip: String(body.address_zip ?? ""),
    address_city: String(body.address_city ?? ""),
    address_country: String(body.address_country ?? "FR"),
    siret: body.siret,
  });
  const address_line = normalized.address_line;
  const address_zip = normalized.address_zip;
  const address_city = normalized.address_city;
  const address_country = normalized.address_country;
  const siretRaw = normalized.siret ?? "";
  const opcoName =
    body.opco_name === undefined || body.opco_name === null
      ? undefined
      : String(body.opco_name).trim() || null;

  if (!address_line || !address_zip || !address_city) {
    return NextResponse.json(
      { error: "Adresse, code postal et ville sont requis." },
      { status: 400 },
    );
  }
  if (siretRaw && siretRaw.length !== 14) {
    return NextResponse.json({ error: "SIRET invalide (14 chiffres)." }, { status: 400 });
  }

  const patch: Record<string, string | null> = {
    address_line,
    address_zip,
    address_city,
    address_country,
  };
  if (siretRaw) patch.siret = siretRaw;
  if (opcoName !== undefined) patch.opco_name = opcoName;

  let updated = await service.from("organizations").update(patch).eq("id", id).select("id").maybeSingle();
  if (updated.error && /opco_name/i.test(updated.error.message) && "opco_name" in patch) {
    const { opco_name: _ignored, ...withoutOpco } = patch;
    updated = await service.from("organizations").update(withoutOpco).eq("id", id).select("id").maybeSingle();
  }
  if (updated.error) {
    const msg = updated.error.message || "Mise à jour impossible";
    if (msg.includes("address_")) {
      return NextResponse.json(
        { error: "Appliquez la migration adresse postale (organizations.address_*)." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  if (!updated.data) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    address: {
      address_line,
      address_zip,
      address_city,
      address_country,
      siret: siretRaw || null,
      opco_name: opcoName ?? null,
    },
  });
}
