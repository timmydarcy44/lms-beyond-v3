import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { acceptBusinessSignal, runBusinessSignaux } from "@/lib/crm/business-signaux";
import { isCallForTender } from "@/lib/open-data/tender";
import { zodMessage } from "@/lib/cfa/fiche-input";
import { getServiceRoleClient } from "@/lib/supabase/server";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run") }),
  z.object({ action: z.literal("accept"), leadId: z.string().uuid() }),
  z.object({ action: z.literal("dismiss"), leadId: z.string().uuid() }),
]);

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const [leads, runs] = await Promise.all([
    db.from("biz_signal_leads").select("id, siret, company_name, city, signal_kind, reason, source_url, status, deal_id, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
    db.from("biz_signal_runs").select("started_at, finished_at, found_count, error").order("started_at", { ascending: false }).limit(1),
  ]);
  const missing = [leads.error, runs.error].find((error) => error && /biz_signal_|schema cache|does not exist/i.test(error.message));
  if (missing) return NextResponse.json({ error: "Collez le script 20261026190000_business_signaux.sql.", leads: [], run: null });
  if (leads.error) return NextResponse.json({ error: leads.error.message }, { status: 400 });
  const visible = [];
  for (const lead of (leads.data ?? []) as { id: string; reason?: string | null; source_url?: string | null }[]) {
    const tender = isCallForTender(String(lead.reason ?? "")) || String(lead.source_url ?? "").includes("boamp.fr");
    if (tender) {
      await db.from("biz_signal_leads").update({ status: "dismissed" }).eq("id", lead.id).eq("status", "pending");
      continue;
    }
    visible.push(lead);
  }
  return NextResponse.json({ leads: visible, run: runs.data?.[0] ?? null });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error, "Action inconnue.") }, { status: 400 });
  if (parsed.data.action === "run") {
    const result = await runBusinessSignaux(db, { force: true });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  }
  if (parsed.data.action === "dismiss") {
    const saved = await db.from("biz_signal_leads").update({ status: "dismissed" }).eq("id", parsed.data.leadId).eq("status", "pending");
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const accepted = await acceptBusinessSignal(db, parsed.data.leadId);
  if (!accepted.ok) return NextResponse.json({ error: accepted.error }, { status: 400 });
  return NextResponse.json(accepted);
}
