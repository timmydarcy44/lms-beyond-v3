import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { acceptBusinessDevLead, capturePublicOffer, runBusinessDev } from "@/lib/cfa/business-dev";
import { zodMessage } from "@/lib/cfa/fiche-input";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run") }),
  z.object({ action: z.literal("accept"), leadId: z.string().uuid() }),
  z.object({ action: z.literal("dismiss"), leadId: z.string().uuid() }),
  z.object({ action: z.literal("capture"), url: z.string().trim().url().max(500), companyName: z.string().trim().max(160).optional() }),
]);

async function actorId() {
  const client = await getServerClient();
  const user = client ? await client.auth.getUser() : null;
  return user?.data.user?.id ?? null;
}

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const runs = await db.from("cfa_bd_runs").select("started_at, finished_at, found_count, error").order("started_at", { ascending: false }).limit(1);
  let leads = await db.from("cfa_bd_leads").select("id, siret, company_name, city, postal_code, naf_code, naf_label, headcount_range, cursus_id, reason, territory, model, source_url, mentions_title, status, company_id, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(50);
  if (leads.error && /source_url|mentions_title/i.test(leads.error.message)) {
    leads = await db.from("cfa_bd_leads").select("id, siret, company_name, city, postal_code, naf_code, naf_label, headcount_range, cursus_id, reason, territory, model, status, company_id, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(50);
  }
  const missing = [leads.error, runs.error].find((error) => error && /cfa_bd_|schema cache|does not exist/i.test(error.message));
  if (missing) return NextResponse.json({ error: "Collez le script 20261026180000_cfa_business_dev.sql.", leads: [], run: null });
  if (leads.error) return NextResponse.json({ error: leads.error.message }, { status: 400 });
  return NextResponse.json({ leads: leads.data ?? [], run: runs.data?.[0] ?? null });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error, "Action inconnue.") }, { status: 400 });
  if (parsed.data.action === "run") {
    const result = await runBusinessDev(db, { force: true });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  }
  if (parsed.data.action === "capture") {
    try {
      return NextResponse.json(await capturePublicOffer(db, parsed.data.url, parsed.data.companyName ?? ""));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Page illisible";
      const missing = /cfa_bd_|schema cache|does not exist/i.test(message);
      return NextResponse.json({ error: missing ? "Collez le script 20261026180000_cfa_business_dev.sql." : message }, { status: 400 });
    }
  }
  if (parsed.data.action === "dismiss") {
    const saved = await db.from("cfa_bd_leads").update({ status: "dismissed" }).eq("id", parsed.data.leadId).eq("status", "pending");
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const accepted = await acceptBusinessDevLead(db, parsed.data.leadId, await actorId());
  if (!accepted.ok) return NextResponse.json({ error: accepted.error }, { status: 400 });
  return NextResponse.json(accepted);
}
