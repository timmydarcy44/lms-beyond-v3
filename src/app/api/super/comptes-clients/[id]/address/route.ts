import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
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
  };

  const address_line = String(body.address_line ?? "").trim();
  const address_zip = String(body.address_zip ?? "").trim();
  const address_city = String(body.address_city ?? "").trim();
  const address_country = String(body.address_country ?? "FR").trim() || "FR";
  const siretRaw = String(body.siret ?? "").replace(/\D/g, "");

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

  const updated = await service.from("organizations").update(patch).eq("id", id).select("id").maybeSingle();
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
    address: { address_line, address_zip, address_city, address_country, siret: siretRaw || null },
  });
}
