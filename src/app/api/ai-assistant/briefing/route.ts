import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateChatWithAnthropic } from "@/lib/ai/anthropic-messages";
import {
  buildDailyBriefingSystemPrompt,
  enrichBriefingWithProspects,
} from "@/lib/crm/daily-briefing-prompt";
import { parseBriefingJson } from "@/lib/crm/parse-briefing-json";
import type { BriefingApiResponse } from "@/lib/crm/daily-briefing-types";
import {
  getPipelineBtobSummary,
  listPipelineBtobDeals,
} from "@/lib/crm/pipeline-btob-mcp";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const [summary, prospects] = await Promise.all([
      getPipelineBtobSummary(),
      listPipelineBtobDeals({ limit: 50 }),
    ]);

    const dateLabel = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const systemPrompt = buildDailyBriefingSystemPrompt(
      prospects as Record<string, unknown>[],
      summary,
      dateLabel,
    );

    const raw = await generateChatWithAnthropic(
      systemPrompt,
      [{ role: "user", content: "Génère le briefing du jour au format JSON strict uniquement." }],
      { model: "claude-sonnet-4-20250514", maxTokens: 2000 },
    );

    if (!raw) {
      return NextResponse.json(
        { error: "Impossible de générer le briefing. Réessayez." },
        { status: 502 },
      );
    }

    let briefing;
    try {
      briefing = parseBriefingJson(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "JSON invalide";
      return NextResponse.json({ error: `Briefing illisible : ${msg}` }, { status: 502 });
    }

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
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
