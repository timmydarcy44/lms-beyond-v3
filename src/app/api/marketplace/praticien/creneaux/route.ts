import { NextRequest, NextResponse } from "next/server";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await assertPraticienAccess();
  if (!access.ok || !access.praticienId) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = searchParams.get("to");

  let query = service
    .from("praticien_creneaux")
    .select("*")
    .eq("praticien_id", access.praticienId)
    .gte("date", from)
    .order("date")
    .order("heure_debut");

  if (to) query = query.lte("date", to);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ creneaux: data ?? [] });
}

type CreneauBody = {
  date?: string;
  heure_debut?: string;
  heure_fin?: string;
};

export async function POST(request: NextRequest) {
  const access = await assertPraticienAccess();
  if (!access.ok || !access.praticienId) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const body = (await request.json()) as CreneauBody;
  const date = String(body.date ?? "").trim();
  const heure_debut = String(body.heure_debut ?? "").trim();
  const heure_fin = String(body.heure_fin ?? "").trim();

  if (!date || !heure_debut || !heure_fin) {
    return NextResponse.json({ error: "date, heure_debut, heure_fin requis" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await service
    .from("praticien_creneaux")
    .insert({
      praticien_id: access.praticienId,
      date,
      heure_debut,
      heure_fin,
      disponible: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ creneau: data });
}

export async function DELETE(request: NextRequest) {
  const access = await assertPraticienAccess();
  if (!access.ok || !access.praticienId) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { error } = await service
    .from("praticien_creneaux")
    .delete()
    .eq("id", id)
    .eq("praticien_id", access.praticienId)
    .eq("disponible", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
