import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { updatePipelineDeal } from "@/lib/crm/pipeline-deal-update";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  let current = await db.from("crm_pipeline_deals").select("notes, next_action").eq("id", id).maybeSingle();
  if (current.error && /notes/i.test(current.error.message)) {
    current = await db.from("crm_pipeline_deals").select("next_action").eq("id", id).maybeSingle();
  }
  if (current.error || !current.data) return NextResponse.json({ error: "Action introuvable" }, { status: 404 });
  const title = String(current.data.next_action ?? "").trim();
  const stamp = new Date().toLocaleDateString("fr-FR");
  const line = title ? `Action faite le ${stamp} : ${title}` : `Action faite le ${stamp}`;
  const notes = [String((current.data as { notes?: string | null }).notes ?? "").trim(), line].filter(Boolean).join("\n");
  let saved = await updatePipelineDeal(db, id, { next_action: null, next_action_date: null, notes });
  if (saved.error && /notes/i.test(saved.error.message)) {
    saved = await updatePipelineDeal(db, id, { next_action: null, next_action_date: null });
  }
  if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
