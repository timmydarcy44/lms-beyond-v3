import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { parseFollowUp, validateCareClient } from "@/lib/expert/care-client-fields";

const SELECT_FULL =
  "id,first_name,last_name,email,phone,address_line,postal_code,city,follow_up,child_one_first_name,child_one_last_name,child_two_first_name,child_two_last_name,notes,created_at";
const SELECT_ADDRESS = "id,first_name,last_name,email,phone,address_line,postal_code,city,notes,created_at";
const SELECT_BASIC = "id,first_name,last_name,email,phone,notes,created_at";

function columnMissing(error: { message?: string } | null) {
  return /address_line|postal_code|city|follow_up|child_one|child_two|schema cache|column/i.test(error?.message ?? "");
}

async function listClients(db: SupabaseClient, expertId: string) {
  const full = await db.from("expert_care_clients").select(SELECT_FULL).eq("expert_id", expertId).order("created_at", { ascending: false });
  if (!full.error) return { clients: full.data ?? [], error: null as string | null };
  if (missingRelation(full.error)) return { clients: [], error: CARE_SQL_HINT };
  const address = await db.from("expert_care_clients").select(SELECT_ADDRESS).eq("expert_id", expertId).order("created_at", { ascending: false });
  if (!address.error) {
    return {
      clients: address.data ?? [],
      error: "Collez supabase/migrations/20261027170000_care_client_children.sql pour enregistrer le suivi enfant.",
    };
  }
  const basic = await db.from("expert_care_clients").select(SELECT_BASIC).eq("expert_id", expertId).order("created_at", { ascending: false });
  if (basic.error) {
    return { clients: [], error: missingRelation(basic.error) ? CARE_SQL_HINT : basic.error.message };
  }
  return {
    clients: basic.data ?? [],
    error: "Collez supabase/migrations/20261027160000_care_client_address.sql puis 20261027170000_care_client_children.sql.",
  };
}

export async function GET() {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const result = await listClients(gate.db, gate.expertId);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as Record<string, string | undefined> | null;
  const followUp = parseFollowUp(body?.follow_up);
  const payload = {
    expert_id: gate.expertId,
    first_name: body?.first_name?.trim() || "",
    last_name: body?.last_name?.trim() || "",
    email: body?.email?.trim().toLowerCase() || "",
    phone: body?.phone?.trim() || "",
    address_line: body?.address_line?.trim() || "",
    postal_code: body?.postal_code?.trim() || "",
    city: body?.city?.trim() || "",
    follow_up: followUp,
    child_one_first_name: followUp === "self" ? null : body?.child_one_first_name?.trim() || null,
    child_one_last_name: followUp === "self" ? null : body?.child_one_last_name?.trim() || null,
    child_two_first_name: followUp === "two_children" ? body?.child_two_first_name?.trim() || null : null,
    child_two_last_name: followUp === "two_children" ? body?.child_two_last_name?.trim() || null : null,
  };
  const invalid = validateCareClient({ ...payload, phone: payload.phone });
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const inserted = await gate.db.from("expert_care_clients").insert(payload).select(SELECT_FULL).single();
  if (!inserted.error) return NextResponse.json({ client: inserted.data });
  if (missingRelation(inserted.error)) return NextResponse.json({ error: CARE_SQL_HINT }, { status: 500 });
  if (columnMissing(inserted.error)) {
    const fallbackPayload = {
      expert_id: payload.expert_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      address_line: payload.address_line,
      postal_code: payload.postal_code,
      city: payload.city,
    };
    const withAddress = await gate.db.from("expert_care_clients").insert(fallbackPayload).select(SELECT_ADDRESS).single();
    if (!withAddress.error) {
      return NextResponse.json({
        client: withAddress.data,
        error: "Collez supabase/migrations/20261027170000_care_client_children.sql pour enregistrer le suivi enfant.",
      });
    }
    const basic = await gate.db
      .from("expert_care_clients")
      .insert({
        expert_id: payload.expert_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
      })
      .select(SELECT_BASIC)
      .single();
    if (basic.error) {
      return NextResponse.json({ error: missingRelation(basic.error) ? CARE_SQL_HINT : basic.error.message }, { status: 500 });
    }
    return NextResponse.json({
      client: basic.data,
      error: "Collez les SQL d'adresse et de suivi enfant pour enregistrer toutes les informations.",
    });
  }
  return NextResponse.json({ error: inserted.error.message }, { status: 500 });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as Record<string, string | undefined> | null;
  const id = body?.id?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Membre requis" }, { status: 400 });
  const patch: Record<string, string | null> = {};
  for (const key of [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address_line",
    "postal_code",
    "city",
    "follow_up",
    "child_one_first_name",
    "child_one_last_name",
    "child_two_first_name",
    "child_two_last_name",
  ] as const) {
    if (typeof body?.[key] === "string") {
      patch[key] = key === "email" ? body[key]!.trim().toLowerCase() : body[key]!.trim() || null;
    }
  }
  if (patch.follow_up) patch.follow_up = parseFollowUp(patch.follow_up);
  const updated = await gate.db.from("expert_care_clients").update(patch).eq("id", id).eq("expert_id", gate.expertId).select(SELECT_FULL).maybeSingle();
  if (!updated.error) return NextResponse.json({ client: updated.data });
  if (columnMissing(updated.error)) {
    const basicKeys = ["first_name", "last_name", "email", "phone", "address_line", "postal_code", "city"];
    const basic: Record<string, string | null> = {};
    for (const key of basicKeys) if (key in patch) basic[key] = patch[key];
    const fallback = await gate.db.from("expert_care_clients").update(basic).eq("id", id).eq("expert_id", gate.expertId).select(SELECT_ADDRESS).maybeSingle();
    if (fallback.error) {
      return NextResponse.json({ error: missingRelation(fallback.error) ? CARE_SQL_HINT : fallback.error.message }, { status: 500 });
    }
    return NextResponse.json({ client: fallback.data });
  }
  if (updated.error) {
    return NextResponse.json({ error: missingRelation(updated.error) ? CARE_SQL_HINT : updated.error.message }, { status: 500 });
  }
  return NextResponse.json({ client: updated.data });
}
