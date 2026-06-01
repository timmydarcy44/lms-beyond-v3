import { NextRequest, NextResponse } from "next/server";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import { BCT_DUREES, BCT_SPECIALITES, BCT_TARIF_MAX_CENTS, BCT_TARIF_MIN_CENTS } from "@/lib/marketplace/praticien-constants";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileBody = {
  photo_url?: string | null;
  titre?: string | null;
  biographie?: string | null;
  specialites?: string[];
  tarif_session?: number;
  duree_session?: number;
};

export async function PATCH(request: NextRequest) {
  const access = await assertPraticienAccess();
  if (!access.ok || !access.praticienId) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const body = (await request.json()) as ProfileBody;
  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const patch: Record<string, unknown> = {};

  if (body.photo_url !== undefined) patch.photo_url = body.photo_url?.trim() || null;
  if (body.titre !== undefined) patch.titre = body.titre?.trim() || null;
  if (body.biographie !== undefined) patch.biographie = body.biographie?.trim() || null;

  if (body.specialites !== undefined) {
    const allowed = new Set<string>(BCT_SPECIALITES);
    patch.specialites = body.specialites.filter((s) => allowed.has(s));
  }

  if (body.tarif_session !== undefined) {
    const cents = Math.round(Number(body.tarif_session));
    if (!Number.isFinite(cents) || cents < BCT_TARIF_MIN_CENTS || cents > BCT_TARIF_MAX_CENTS) {
      return NextResponse.json(
        { error: `Tarif entre ${BCT_TARIF_MIN_CENTS / 100}€ et ${BCT_TARIF_MAX_CENTS / 100}€` },
        { status: 400 },
      );
    }
    patch.tarif_session = cents;
  }

  if (body.duree_session !== undefined) {
    const d = Number(body.duree_session);
    if (!(BCT_DUREES as readonly number[]).includes(d)) {
      return NextResponse.json({ error: "Durée : 45 ou 60 minutes" }, { status: 400 });
    }
    patch.duree_session = d;
  }

  const { data, error } = await service
    .from("praticiens_bct")
    .update(patch)
    .eq("id", access.praticienId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ praticien: data });
}
