import type { CrmAction } from "@/lib/crm/ai-assistant-types";
import { stripMarkdownForSpeech } from "@/lib/voice/prepare-text-for-speech";

export function parseAssistantResponse(raw: string): { cleanReply: string; action: CrmAction } {
  const actionMatch = raw.match(/<action>([\s\S]*?)<\/action>/);
  let action: CrmAction = { type: "none", payload: {} };

  if (actionMatch?.[1]) {
    try {
      const parsed = JSON.parse(actionMatch[1].trim()) as Partial<CrmAction>;
      if (parsed.type === "create_prospect" || parsed.type === "update_prospect") {
        action = {
          type: parsed.type,
          payload: (parsed.payload as Record<string, unknown>) ?? {},
        };
      }
    } catch {
      action = { type: "none", payload: {} };
    }
  }

  const cleanReply = stripMarkdownForSpeech(
    raw.replace(/<action>[\s\S]*?<\/action>/g, "").trim(),
  );
  return { cleanReply: cleanReply || "D'accord.", action };
}
