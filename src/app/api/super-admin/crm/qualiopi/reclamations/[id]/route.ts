import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { parseReclamationSource } from "@/lib/qualiopi/reclamation-sources";
import { parseReclamationStep, RECLAMATION_STEPS } from "@/lib/qualiopi/reclamation-status";
import { parseReclamationTheme } from "@/lib/qualiopi/reclamation-themes";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const now = new Date().toISOString();

  if (typeof body.subject === "string") patch.subject = body.subject.trim();
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.requester_name === "string") patch.requester_name = body.requester_name.trim() || null;
  if (typeof body.requester_email === "string") patch.requester_email = body.requester_email.trim() || null;
  if (typeof body.requester_role === "string") patch.requester_role = body.requester_role.trim() || null;
  if (typeof body.requester_company === "string") {
    patch.requester_company = body.requester_company.trim() || null;
  }
  if (typeof body.resolution_note === "string") {
    patch.resolution_note = body.resolution_note.trim() || null;
  }
  const theme = parseReclamationTheme(body.theme);
  if (theme) patch.theme = theme;
  const source = parseReclamationSource(body.source);
  if (source) patch.source = source;

  if (typeof body.status === "string") {
    const step = parseReclamationStep(body.status);
    if ((RECLAMATION_STEPS as readonly string[]).includes(body.status) || ["open", "in_progress", "closed"].includes(body.status)) {
      patch.status = ["open", "in_progress", "closed"].includes(body.status) ? body.status : step;
      if (step === "closed" || body.status === "closed") {
        patch.closed_at = now;
        patch.status = "closed";
      }
      if (step === "acknowledged") patch.ack_at = patch.ack_at ?? now;
      if (step === "answered") patch.answered_at = patch.answered_at ?? now;
      if (step === "received") {
        /* keep */
      }
    }
  }

  if (body.ack === true) {
    patch.ack_at = now;
    patch.status = "acknowledged";
  }
  if (body.reopen === true) {
    patch.status = "analysis";
    patch.closed_at = null;
  }
  if ("action_id" in body) patch.action_id = body.action_id ? String(body.action_id) : null;
  if ("ticket_id" in body) patch.ticket_id = body.ticket_id ? String(body.ticket_id) : null;
  if ("ticket_url" in body) patch.ticket_url = body.ticket_url ? String(body.ticket_url) : null;

  // Legacy response field
  if (typeof body.response === "string") {
    patch.response = body.response.trim() || null;
    if (body.response.trim()) {
      patch.answered_at = now;
      if (body.close === true) {
        patch.status = "closed";
        patch.closed_at = now;
      } else {
        patch.status = "answered";
        if (!body.ack) patch.ack_at = patch.ack_at ?? now;
      }
    }
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.ack === true || body.reopen === true || body.status) {
    const label =
      body.ack === true
        ? "Étape : accusé de réception"
        : body.reopen === true
          ? "Réclamation rouverte"
          : `Étape : ${String(body.status)}`;
    await supabase.from("crm_qualiopi_reclamation_messages").insert({
      reclamation_id: id,
      kind: "system_step",
      body: label,
    });
  }

  return NextResponse.json({ reclamation: data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const { error } = await supabase.from("crm_qualiopi_reclamations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
