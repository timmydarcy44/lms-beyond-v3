import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import {
  newPrestationId,
  resolveCarePrestations,
  serializeCarePrestations,
  type CarePrestation,
} from "@/lib/expert/care-prestations";
import { mergeRegistrationMeta, parseRegistrationMeta } from "@/lib/expert/expert-registration-meta";
import { eurosToCents } from "@/lib/entreprise/offer-conditions";

function catalogFrom(references: unknown) {
  return resolveCarePrestations(parseRegistrationMeta(references)?.care_prestations);
}

async function saveCatalog(db: SupabaseClient, expertId: string, references: unknown, list: CarePrestation[]) {
  const next = mergeRegistrationMeta(references, { care_prestations: serializeCarePrestations(list) });
  const { error } = await db.from("experts").update({ references: next }).eq("id", expertId);
  if (error) return error.message;
  return null;
}

export async function GET() {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const expert = await gate.db.from("experts").select("references").eq("id", gate.expertId).maybeSingle();
  if (expert.error) {
    return NextResponse.json({ error: missingRelation(expert.error) ? CARE_SQL_HINT : expert.error.message, prestations: [] }, { status: missingRelation(expert.error) ? 200 : 500 });
  }
  return NextResponse.json({ prestations: catalogFrom(expert.data?.references) });
}

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { label?: string; amount?: string; cents?: number | null } | null;
  const label = body?.label?.trim() ?? "";
  if (!label) return NextResponse.json({ error: "Indiquez le nom de la prestation." }, { status: 400 });
  const expert = await gate.db.from("experts").select("references").eq("id", gate.expertId).maybeSingle();
  if (expert.error) return NextResponse.json({ error: expert.error.message }, { status: 500 });
  const current = catalogFrom(expert.data?.references);
  const cents = body?.cents == null && body?.amount == null ? null : body.cents != null ? Math.max(0, Math.round(body.cents)) : eurosToCents(String(body.amount ?? ""));
  const next: CarePrestation[] = [...current, { id: newPrestationId(label, current), label, cents, builtin: false }];
  const error = await saveCatalog(gate.db, gate.expertId, expert.data?.references, next);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, prestations: next });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { id?: string; label?: string; amount?: string; cents?: number | null; free?: boolean } | null;
  const id = body?.id?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Prestation requise" }, { status: 400 });
  const expert = await gate.db.from("experts").select("references").eq("id", gate.expertId).maybeSingle();
  if (expert.error) return NextResponse.json({ error: expert.error.message }, { status: 500 });
  const current = catalogFrom(expert.data?.references);
  const index = current.findIndex((item) => item.id === id);
  if (index < 0) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 });
  const item = current[index];
  const label = body?.label?.trim() || item.label;
  const cents = body?.free
    ? null
    : body?.cents !== undefined
      ? body.cents == null
        ? null
        : Math.max(0, Math.round(body.cents))
      : body?.amount !== undefined
        ? eurosToCents(String(body.amount ?? ""))
        : item.cents;
  const next = current.map((row, i) => (i === index ? { ...row, label, cents } : row));
  const error = await saveCatalog(gate.db, gate.expertId, expert.data?.references, next);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, prestations: next });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim() ?? "";
  const currentWait = await gate.db.from("experts").select("references").eq("id", gate.expertId).maybeSingle();
  if (currentWait.error) return NextResponse.json({ error: currentWait.error.message }, { status: 500 });
  const current = catalogFrom(currentWait.data?.references);
  const item = current.find((row) => row.id === id);
  if (!item) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 });
  if (item.builtin) return NextResponse.json({ error: "Cette prestation fait partie du catalogue Byound Care." }, { status: 400 });
  const next = current.filter((row) => row.id !== id);
  const error = await saveCatalog(gate.db, gate.expertId, currentWait.data?.references, next);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, prestations: next });
}
