import { NextResponse } from "next/server";
import { generateChatWithAnthropic } from "@/lib/ai/anthropic-messages";
import { resolveBriefingAccess } from "@/lib/crm/briefing-access";
import {
  buildDailyBriefingSystemPrompt,
  buildOrgDailyBriefingSystemPrompt,
  enrichBriefingWithProspects,
} from "@/lib/crm/daily-briefing-prompt";
import { buildPipelineCoachBriefing, mergeBriefingWithPipelineData } from "@/lib/crm/build-pipeline-coach-briefing";
import { parseBriefingJson } from "@/lib/crm/parse-briefing-json";
import type { BriefingApiResponse } from "@/lib/crm/daily-briefing-types";
import { emptyDailyBriefing } from "@/lib/crm/empty-daily-briefing";
import {
  getPipelineBtobSummary,
  listPipelineBtobDeals,
} from "@/lib/crm/pipeline-btob-mcp";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await resolveBriefingAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const orgFilter =
      access.scope === "organization" ? access.organizationId : undefined;

    const [summary, prospects] = await Promise.all([
      getPipelineBtobSummary({ organization_id: orgFilter }),
      listPipelineBtobDeals({ limit: 50, organization_id: orgFilter }),
    ]);

    const dateLabel = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let systemPrompt: string;
    if (access.scope === "global") {
      systemPrompt = buildDailyBriefingSystemPrompt(
        prospects as Record<string, unknown>[],
        summary,
        dateLabel,
      );
    } else {
      const service = getServiceRoleClient();
      const { data: org } = service
        ? await service
            .from("organizations")
            .select("name")
            .eq("id", access.organizationId)
            .maybeSingle()
        : { data: null };
      systemPrompt = buildOrgDailyBriefingSystemPrompt(
        prospects as Record<string, unknown>[],
        summary,
        dateLabel,
        String(org?.name ?? "Votre organisation"),
      );
    }

    const raw = await generateChatWithAnthropic(
      systemPrompt,
      [{ role: "user", content: "Génère le briefing du jour au format JSON strict uniquement." }],
      { model: "claude-sonnet-4-20250514", maxTokens: 2000 },
    );

    let briefing;
    if (!raw) {
      briefing = buildPipelineCoachBriefing(
        prospects as Record<string, unknown>[],
        summary,
      );
    } else {
      try {
        briefing = parseBriefingJson(raw);
      } catch (e) {
        console.warn("[ai-assistant/briefing] JSON invalide, fallback pipeline:", e);
        briefing = buildPipelineCoachBriefing(
          prospects as Record<string, unknown>[],
          summary,
        );
      }
    }

    briefing = mergeBriefingWithPipelineData(
      briefing,
      prospects as Record<string, unknown>[],
      summary,
    );

    briefing = enrichBriefingWithProspects(
      briefing,
      prospects as Record<string, unknown>[],
    );

    const response: BriefingApiResponse = {
      briefing,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ai-assistant/briefing]", error);
    try {
      const summary = await getPipelineBtobSummary();
      const prospects = await listPipelineBtobDeals({ limit: 50 });
      const response: BriefingApiResponse = {
        briefing: enrichBriefingWithProspects(
          buildPipelineCoachBriefing(prospects as Record<string, unknown>[], summary),
          prospects as Record<string, unknown>[],
        ),
        generated_at: new Date().toISOString(),
      };
      return NextResponse.json(response);
    } catch {
      const response: BriefingApiResponse = {
        briefing: emptyDailyBriefing(),
        generated_at: new Date().toISOString(),
      };
      return NextResponse.json(response);
    }
  }
}
