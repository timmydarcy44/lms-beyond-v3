import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildBriefingCoachSystemPrompt } from "@/lib/crm/briefing-coach-prompt";
import type { DailyBriefing } from "@/lib/crm/daily-briefing-types";
import { generateChatWithAnthropic } from "@/lib/ai/anthropic-messages";
import { prepareTextForSpeech } from "@/lib/voice/prepare-text-for-speech";

export const dynamic = "force-dynamic";

type CoachRequest = {
  message: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  briefing?: DailyBriefing | null;
};

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: CoachRequest | null = null;
  try {
    body = (await request.json()) as CoachRequest;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const message = String(body?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  const history = Array.isArray(body?.conversationHistory)
    ? body.conversationHistory
        .slice(-12)
        .filter((m) => m?.role === "user" || m?.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: String(m.content ?? "").trim(),
        }))
        .filter((m) => m.content.length > 0)
    : [];

  const systemPrompt = buildBriefingCoachSystemPrompt(body?.briefing ?? null);

  const raw = await generateChatWithAnthropic(
    systemPrompt,
    [...history, { role: "user", content: message }],
    { model: "claude-sonnet-4-20250514", maxTokens: 800 },
  );

  if (!raw) {
    return NextResponse.json(
      { error: "Désolé, je n'ai pas pu répondre. Réessaie." },
      { status: 502 },
    );
  }

  const reply = prepareTextForSpeech(raw.replace(/<action>[\s\S]*?<\/action>/g, "").trim());
  return NextResponse.json({ reply });
}
