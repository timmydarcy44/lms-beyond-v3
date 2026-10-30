import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { ensureCareProfile } from "@/lib/care/ensure-profile";
import { revalidateCarePublicProfile } from "@/lib/care/revalidate-profile";
import { parseRegistrationMeta } from "@/lib/expert/expert-registration-meta";
import { eurosToCents } from "@/lib/entreprise/offer-conditions";
import type { CarePrestation } from "@/lib/expert/care-prestations";
import type { CareDomain } from "@/lib/care/domains";

function asPrestation(row: {
  id: unknown;
  name?: unknown;
  price_cents?: unknown;
  active?: unknown;
}): CarePrestation {
  const cents = Number(row.price_cents);
  return {
    id: String(row.id),
    label: String(row.name ?? "").trim() || "Prestation",
    cents: Number.isFinite(cents) && cents > 0 ? Math.round(cents) : null,
    builtin: false,
  };
}

async function listServices(db: SupabaseClient, expertId: string) {
  const { data, error } = await db
    .from("care_services")
    .select("id, name, price_cents, active, position")
    .eq("expert_id", expertId)
    .order("position");
  if (error) return { error, prestations: [] as CarePrestation[] };
  return {
    error: null,
    prestations: (data ?? []).filter((row) => row.active !== false).map(asPrestation),
  };
}

async function migrateLegacyCatalog(db: SupabaseClient, expertId: string) {
  const { data: existing } = await db.from("care_services").select("id").eq("expert_id", expertId).limit(1);
  if (existing?.length) return;
  const expert = await db.from("experts").select("references").eq("id", expertId).maybeSingle();
  const stored = parseRegistrationMeta(expert.data?.references)?.care_prestations ?? [];
  if (!stored.length) return;
  await ensureCareProfile(db, expertId);
  await db.from("care_services").insert(
    stored.map((item, index) => ({
      expert_id: expertId,
      position: index,
      name: item.label,
      domain: "famille" as CareDomain,
      description: "",
      duration_min: 60,
      formats: ["visio", "cabinet"],
      price_cents: item.cents ?? 0,
      active: true,
    })),
  );
}

export async function GET() {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  try {
    await ensureCareProfile(gate.db, gate.expertId);
    await migrateLegacyCatalog(gate.db, gate.expertId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profil Care indisponible";
    return NextResponse.json({ error: /does not exist|schema cache/i.test(message) ? CARE_SQL_HINT : message, prestations: [] }, { status: 200 });
  }
  const listed = await listServices(gate.db, gate.expertId);
  if (listed.error) {
    return NextResponse.json(
      { error: missingRelation(listed.error) ? CARE_SQL_HINT : listed.error.message, prestations: [] },
      { status: missingRelation(listed.error) ? 200 : 500 },
    );
  }
  return NextResponse.json({ prestations: listed.prestations });
}

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { label?: string; amount?: string; cents?: number | null } | null;
  const label = body?.label?.trim() ?? "";
  if (!label) return NextResponse.json({ error: "Indiquez le nom de la prestation." }, { status: 400 });
  await ensureCareProfile(gate.db, gate.expertId);
  const cents = body?.cents == null && body?.amount == null ? 0 : body.cents != null ? Math.max(0, Math.round(body.cents)) : eurosToCents(String(body.amount ?? "")) ?? 0;
  const { data: last } = await gate.db.from("care_services").select("position").eq("expert_id", gate.expertId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await gate.db.from("care_services").insert({
    expert_id: gate.expertId,
    position: Number(last?.position ?? -1) + 1,
    name: label,
    domain: "famille",
    description: "",
    duration_min: 60,
    formats: ["visio", "cabinet"],
    price_cents: cents,
    active: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: profile } = await gate.db.from("care_profiles").select("slug").eq("expert_id", gate.expertId).maybeSingle();
  if (profile?.slug) revalidateCarePublicProfile(String(profile.slug));
  const listed = await listServices(gate.db, gate.expertId);
  return NextResponse.json({ ok: true, prestations: listed.prestations });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { id?: string; label?: string; amount?: string; cents?: number | null; free?: boolean } | null;
  const id = body?.id?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Prestation requise" }, { status: 400 });
  const { data: current } = await gate.db.from("care_services").select("id, name, price_cents").eq("id", id).eq("expert_id", gate.expertId).maybeSingle();
  if (!current) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 });
  const label = body?.label?.trim() || String(current.name);
  const cents = body?.free
    ? 0
    : body?.cents !== undefined
      ? body.cents == null
        ? 0
        : Math.max(0, Math.round(body.cents))
      : body?.amount !== undefined
        ? eurosToCents(String(body.amount ?? "")) ?? 0
        : Number(current.price_cents) || 0;
  const { error } = await gate.db.from("care_services").update({ name: label, price_cents: cents }).eq("id", id).eq("expert_id", gate.expertId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: profile } = await gate.db.from("care_profiles").select("slug").eq("expert_id", gate.expertId).maybeSingle();
  if (profile?.slug) revalidateCarePublicProfile(String(profile.slug));
  const listed = await listServices(gate.db, gate.expertId);
  return NextResponse.json({ ok: true, prestations: listed.prestations });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim() ?? "";
  const { data: booked } = await gate.db.from("care_bookings").select("id").eq("service_id", id).eq("expert_id", gate.expertId).limit(1);
  if (booked?.length) {
    const { error } = await gate.db.from("care_services").update({ active: false }).eq("id", id).eq("expert_id", gate.expertId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await gate.db.from("care_services").delete().eq("id", id).eq("expert_id", gate.expertId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: profile } = await gate.db.from("care_profiles").select("slug").eq("expert_id", gate.expertId).maybeSingle();
  if (profile?.slug) revalidateCarePublicProfile(String(profile.slug));
  const listed = await listServices(gate.db, gate.expertId);
  return NextResponse.json({ ok: true, prestations: listed.prestations });
}
