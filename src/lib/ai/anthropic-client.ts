/**
 * Client Anthropic centralisé
 */

let anthropicClient: any = null;

export function getAnthropicClient() {
  if (anthropicClient) {
    return anthropicClient;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ai] ANTHROPIC_API_KEY not configured in environment variables");
    console.error("[ai] Please add ANTHROPIC_API_KEY to your .env.local file");
    return null;
  }

  if (apiKey.length < 10) {
    console.error("[ai] ANTHROPIC_API_KEY appears to be invalid (too short)");
    return null;
  }

  // On utilise fetch directement car le SDK Anthropic peut avoir des problèmes de compatibilité
  return { apiKey };
}

export async function generateTextWithAnthropic(
  prompt: string,
  systemPrompt?: string,
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) {
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": client.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options?.model || "claude-3-5-sonnet-20241022",
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[ai] Anthropic API error:", error);
      return null;
    }

    const data = await response.json();
    return data.content[0]?.text ?? null;
  } catch (error) {
    console.error("[ai] Error generating text with Anthropic", error);
    return null;
  }
}

export async function generateJSONWithAnthropic(
  prompt: string,
  systemPrompt?: string,
  options?: { model?: string; maxTokens?: number }
): Promise<any | null> {
  const client = getAnthropicClient();
  if (!client) {
    console.error("[ai] Anthropic client not available - ANTHROPIC_API_KEY missing");
    console.error("[ai] Please add ANTHROPIC_API_KEY to your .env.local file");
    return null;
  }

  // Vérifier que la clé API est valide
  if (!client.apiKey || client.apiKey.length < 10) {
    console.error("[ai] ANTHROPIC_API_KEY appears to be invalid (too short or empty)");
    return null;
  }

  const fullSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\nTu dois répondre UNIQUEMENT avec un JSON valide. Ne réponds avec AUCUN texte avant ou après le JSON.`
    : "Tu dois répondre UNIQUEMENT avec un JSON valide. Ne réponds avec AUCUN texte avant ou après le JSON.";

  try {
    console.log("[ai] Calling Anthropic API for JSON generation", {
      promptLength: prompt.length,
      systemPromptLength: fullSystemPrompt.length,
      model: options?.model || "claude-3-5-sonnet-20241022",
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": client.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options?.model || "claude-3-5-sonnet-20241022",
        max_tokens: options?.maxTokens || 4096,
        temperature: 0.7,
        system: fullSystemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      console.error("[ai] Anthropic API error:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      return null;
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    
    if (!content) {
      console.error("[ai] No content in Anthropic response", data);
      return null;
    }

    console.log("[ai] Anthropic response content length:", content.length);

    try {
      const parsed = JSON.parse(content);
      console.log("[ai] Successfully parsed JSON from Anthropic", {
        keys: Object.keys(parsed),
        hasSections: !!parsed.sections,
        sectionsCount: parsed.sections?.length,
      });
      return parsed;
    } catch (parseError) {
      console.error("[ai] Error parsing JSON response from Anthropic", {
        parseError,
        contentPreview: content.substring(0, 500),
        contentLength: content.length,
      });
      return null;
    }
  } catch (error) {
    console.error("[ai] Error generating JSON with Anthropic", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

