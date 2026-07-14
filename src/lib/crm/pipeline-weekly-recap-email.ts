import { sendEmail } from "@/lib/email/resend-client";
import { computeDealIntelligence } from "@/lib/crm/pipeline-deal-intelligence";
import { PIPELINE_BTOB_CONTACT_OWNERS } from "@/lib/crm/pipeline-btob-owners";
import { pipelineActionLabel } from "@/lib/crm/pipeline-deal-action-types";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function weekStartIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export async function sendPipelineWeeklyRecapEmails(): Promise<
  Record<string, { sent: boolean; deals: number; actions: number }>
> {
  const service = getServiceRoleClient();
  if (!service) {
    return {};
  }

  const since = weekStartIso();
  const weekLabel = format(new Date(), "'Semaine du' d MMMM yyyy", { locale: fr });
  const results: Record<string, { sent: boolean; deals: number; actions: number }> = {};

  for (const owner of PIPELINE_BTOB_CONTACT_OWNERS) {
    const { data: deals } = await service
      .from("crm_pipeline_deals")
      .select("*")
      .eq("pipeline_type", "btob")
      .eq("contact_owner_email", owner.email)
      .order("updated_at", { ascending: false })
      .limit(100);

    const dealList = (deals ?? []).filter(
      (d) => d.stage_slug !== "reussi" && d.stage_slug !== "echec",
    );
    const dealIds = dealList.map((d) => d.id);

    let actions: Array<{
      deal_id: string;
      action_type: string;
      ai_summary: string | null;
      notes: string | null;
      created_at: string;
    }> = [];

    if (dealIds.length > 0) {
      const { data: actionRows } = await service
        .from("crm_pipeline_deal_actions")
        .select("deal_id, action_type, ai_summary, notes, created_at")
        .in("deal_id", dealIds)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      actions = actionRows ?? [];
    }

    const actionsByDeal = new Map<string, typeof actions>();
    for (const a of actions) {
      const list = actionsByDeal.get(a.deal_id) ?? [];
      list.push(a);
      actionsByDeal.set(a.deal_id, list);
    }

    const activeDeals = dealList.filter(
      (d) =>
        d.updated_at >= since
        || actionsByDeal.has(d.id)
        || (d.next_action_date && d.next_action_date >= since.slice(0, 10)),
    );

    const overdue = activeDeals.filter((d) => computeDealIntelligence(d).atRisk);

    const dealRowsHtml =
      activeDeals.length === 0
        ? "<p>Aucune activité notable cette semaine sur votre pipe actif.</p>"
        : activeDeals
            .slice(0, 25)
            .map((d) => {
              const intel = computeDealIntelligence(d);
              const dealActions = actionsByDeal.get(d.id) ?? [];
              const actionsHtml =
                dealActions.length === 0
                  ? "<li>Aucune action loguée cette semaine</li>"
                  : dealActions
                      .slice(0, 5)
                      .map(
                        (a) =>
                          `<li>${pipelineActionLabel(a.action_type)} — ${(a.ai_summary ?? a.notes ?? "—").slice(0, 120)}</li>`,
                      )
                      .join("");
              const aiBlock = d.ai_prospect_summary
                ? `<p style="margin:8px 0 0;font-size:13px;color:#374151;white-space:pre-wrap;">${String(d.ai_prospect_summary).slice(0, 500)}${String(d.ai_prospect_summary).length > 500 ? "…" : ""}</p>`
                : "";
              return `
              <div style="margin-bottom:20px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;">
                <p style="margin:0 0 6px;font-weight:600;">${d.company_name}</p>
                <p style="margin:0 0 6px;font-size:13px;color:#4b5563;">
                  Health ${intel.healthScore}/100 · ${intel.nextBestAction}
                </p>
                <ul style="margin:0;padding-left:18px;font-size:13px;">${actionsHtml}</ul>
                ${aiBlock}
              </div>`;
            })
            .join("");

    const html = `
      <div style="font-family:system-ui,sans-serif;color:#111827;max-width:640px;">
        <p>Bonjour ${owner.label.split(" ")[0]},</p>
        <p>Voici votre récap pipeline BTOB — <strong>${weekLabel}</strong>.</p>
        <p>
          <strong>${activeDeals.length}</strong> dossier(s) actifs ·
          <strong>${actions.length}</strong> action(s) ·
          <strong>${overdue.length}</strong> en risque
        </p>
        ${dealRowsHtml}
        <p style="margin-top:24px;font-size:13px;color:#6b7280;">
          <a href="https://edgebs.fr/super/crm/pipeline">Ouvrir le pipeline EDGE</a>
        </p>
      </div>`;

    const result = await sendEmail({
      to: owner.email,
      subject: `[EDGE CRM] Récap hebdo — ${activeDeals.length} dossier(s), ${actions.length} action(s)`,
      html,
      skipBcc: false,
    });

    results[owner.email] = {
      sent: result.success,
      deals: activeDeals.length,
      actions: actions.length,
    };
  }

  return results;
}
