import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { formatCreatedByShort } from "@/lib/cfa/person-origin";
import { recordCfaTouch } from "@/lib/cfa/upsert-cfa-person";
import { loadCfaApplicationBoard } from "@/lib/cfa/load-cfa-crm";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function actorLabel() {
  const session = await getSession();
  if (!session) return { id: null as string | null, label: "l’équipe" };
  const db = getServiceRoleClient();
  const profile = db
    ? await db.from("profiles").select("first_name, last_name, full_name").eq("id", session.id).maybeSingle()
    : { data: null };
  const row = profile.data as { first_name?: string; last_name?: string; full_name?: string } | null;
  return {
    id: session.id,
    label: formatCreatedByShort(row?.first_name || session.fullName?.split(" ")[0], row?.last_name),
  };
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const board = await loadCfaApplicationBoard(db, "admin");
  if ("error" in board && board.error) return NextResponse.json({ error: board.error }, { status: 400 });
  const people = (board.applications ?? []).filter((row) => String((row as { status?: string }).status) === "prospect");
  const ids = people.map((row) => String((row as { id: string }).id));
  const touchesQuery = ids.length
    ? await db.from("cfa_person_touches").select("*").in("person_id", ids).order("created_at", { ascending: false })
    : { data: [], error: null };
  const jpo = await db.from("cfa_jpo_events").select("id, name, held_on").order("held_on", { ascending: false });
  const actor = await actorLabel();
  return NextResponse.json({
    prospects: people,
    monthPeople: board.applications ?? [],
    touches: touchesQuery.error ? [] : touchesQuery.data ?? [],
    jpoEvents: jpo.error ? [] : jpo.data ?? [],
    actor,
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    action?: string;
    prospectStatus?: string;
  } | null;
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Dossier manquant." }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const actor = await actorLabel();

  if (body?.action === "promote") {
    const current = await db.from("cfa_applications").select("*").eq("id", id).maybeSingle();
    if (!current.data) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
    const { error } = await db
      .from("cfa_applications")
      .update({
        status: "profile",
        prospect_status: null,
        last_touch: current.data.source_channel ?? current.data.last_touch ?? "web_preregistration",
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await recordCfaTouch(db, {
      personId: id,
      type: "stage_change",
      detail: "prospect → candidate",
      createdBy: actor.id,
    });
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "log_exchange") {
    const type = String((body as { exchangeType?: string }).exchangeType ?? "note");
    const detail = String((body as { detail?: string }).detail ?? "Échange");
    await recordCfaTouch(db, {
      personId: id,
      type: type === "email_sent" ? "email_sent" : type === "call" ? "call" : "note",
      detail,
      createdBy: actor.id,
    });
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "set_status") {
    const status = String(body.prospectStatus ?? "");
    if (!["new", "to_call", "called", "not_interested"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }
    const { error } = await db.from("cfa_applications").update({ prospect_status: status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await recordCfaTouch(db, {
      personId: id,
      type: status === "called" || status === "to_call" ? "call" : "created",
      detail: status,
      createdBy: actor.id,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
