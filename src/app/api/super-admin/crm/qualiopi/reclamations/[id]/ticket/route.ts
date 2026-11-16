import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Crée un ticket produit lié à la réclamation (table crm_product_tickets). */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  let recRes = await supabase
    .from("crm_qualiopi_reclamations")
    .select("id, subject, description, ticket_id, ticket_url")
    .eq("id", id)
    .maybeSingle();
  if (recRes.error && /ticket_id|ticket_url|column/i.test(recRes.error.message)) {
    recRes = await supabase
      .from("crm_qualiopi_reclamations")
      .select("id, subject, description")
      .eq("id", id)
      .maybeSingle();
  }
  const { data: rec, error: loadErr } = recRes;
  if (loadErr || !rec) {
    return NextResponse.json({ error: loadErr?.message || "Réclamation introuvable" }, { status: 404 });
  }
  if ("ticket_id" in rec && rec.ticket_id) {
    const { data: existing } = await supabase
      .from("crm_product_tickets")
      .select("*")
      .eq("id", rec.ticket_id)
      .maybeSingle();
    return NextResponse.json({ ticket: existing, already: true });
  }

  let createdBy: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    createdBy = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  const title = String(body.title ?? `Réclamation — ${rec.subject}`).trim();
  const description = String(body.description ?? rec.description ?? "").trim() || null;

  const { data: ticket, error } = await supabase
    .from("crm_product_tickets")
    .insert({
      title,
      description,
      status: "open",
      reclamation_id: id,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "Table crm_product_tickets absente — appliquer la migration 20261116160000_qualiopi_reclamations_v2.sql",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const ticketUrl = `/super/crm/qualiopi/qualite?tab=reclamations&id=${id}&ticket=${ticket.id}`;
  await supabase
    .from("crm_qualiopi_reclamations")
    .update({
      ticket_id: ticket.id,
      ticket_url: ticketUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.from("crm_qualiopi_reclamation_messages").insert({
    reclamation_id: id,
    kind: "system_step",
    body: `Ticket produit #${String(ticket.id).slice(0, 8)} créé`,
  });

  return NextResponse.json({ ticket: { ...ticket, url: ticketUrl } });
}
