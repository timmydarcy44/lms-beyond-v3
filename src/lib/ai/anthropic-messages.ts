import { getAnthropicClient } from "@/lib/ai/anthropic-client";

export type AnthropicChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateChatWithAnthropic(
  systemPrompt: string,
  messages: AnthropicChatMessage[],
  options?: { model?: string; maxTokens?: number },
): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": client.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options?.model ?? "claude-sonnet-4-20250514",
        max_tokens: options?.maxTokens ?? 1000,
        temperature: 0.4,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("[ai-assistant] Anthropic error:", await response.text());
      return null;
    }

    const data = (await response.json()) as { content?: { text?: string }[] };
    return data.content?.[0]?.text ?? null;
  } catch (error) {
    console.error("[ai-assistant] Anthropic request failed:", error);
    return null;
  }
}
