import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildCrmAssistantSystemPrompt } from "@/lib/crm/ai-assistant-prompt";
import type { AssistantRequest, AssistantResponse } from "@/lib/crm/ai-assistant-types";
import { executeCrmAssistantAction } from "@/lib/crm/execute-assistant-action";
import {
  getPipelineBtobSummary,
  listPipelineBtobDeals,
} from "@/lib/crm/pipeline-btob-mcp";
import { parseAssistantResponse } from "@/lib/crm/parse-assistant-action";
import { generateChatWithAnthropic } from "@/lib/ai/anthropic-messages";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: AssistantRequest | null = null;
  try {
    body = (await request.json()) as AssistantRequest;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const message = String(body?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  const history = Array.isArray(body?.conversationHistory)
    ? body.conversationHistory
        .slice(-10)
        .filter((m) => m?.role === "user" || m?.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: String(m.content ?? "").trim(),
        }))
        .filter((m) => m.content.length > 0)
    : [];

  try {
    const [pipelineSummary, recentProspects] = await Promise.all([
      getPipelineBtobSummary(),
      listPipelineBtobDeals({ limit: 10 }),
    ]);

    const systemPrompt = buildCrmAssistantSystemPrompt(
      pipelineSummary,
      recentProspects as Record<string, unknown>[],
    );

    const raw = await generateChatWithAnthropic(
      systemPrompt,
      [...history, { role: "user", content: message }],
      { model: "claude-sonnet-4-20250514", maxTokens: 1000 },
    );

    if (!raw) {
      return NextResponse.json(
        { error: "Désolé, une erreur est survenue. Réessaie." },
        { status: 502 },
      );
    }

    const { cleanReply, action } = parseAssistantResponse(raw);
    const actionResults = [];

    if (action.type !== "none") {
      actionResults.push(await executeCrmAssistantAction(action));
    }

    const response: AssistantResponse = {
      reply: cleanReply,
      actions: action.type !== "none" ? [action] : undefined,
      actionResults: actionResults.length > 0 ? actionResults : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
