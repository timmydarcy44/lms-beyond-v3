import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[ai] OPENAI_API_KEY not configured");
    return null;
  }

  openaiClient = new OpenAI({
    apiKey,
  });

  return openaiClient;
}

export async function generateText(prompt: string, options?: { model?: string; maxTokens?: number }): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: options?.model || "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: options?.maxTokens || 2000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("[ai] Error generating text", error);
    return null;
  }
}

export async function generateJSON(
  prompt: string, 
  schema?: any,
  systemPrompt?: string
): Promise<any | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    // Construire le prompt système
    let fullSystemPrompt = systemPrompt || "";
    
    if (schema) {
      const schemaStr = JSON.stringify(schema.parameters || schema);
      const schemaInstruction = `Tu dois répondre UNIQUEMENT avec un JSON valide respectant ce schéma : ${schemaStr}. Ne réponds avec AUCUN texte avant ou après le JSON.`;
      
      if (fullSystemPrompt) {
        fullSystemPrompt = `${fullSystemPrompt}\n\n${schemaInstruction}`;
      } else {
        fullSystemPrompt = schemaInstruction;
      }
    } else if (!fullSystemPrompt) {
      fullSystemPrompt = "Tu dois répondre UNIQUEMENT avec un JSON valide. Ne réponds avec AUCUN texte avant ou après le JSON.";
    }

    // Utiliser json_object comme format par défaut (plus compatible)
    // json_schema nécessite un modèle spécifique qui pourrait ne pas être disponible
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: fullSystemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.65,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error("[ai] Error parsing JSON response", parseError, content);
      return null;
    }
  } catch (error) {
    console.error("[ai] Error generating JSON", error);
    return null;
  }
}

type SpeechGenerationOptions = {
  voice?: string;
  format?: "mp3" | "wav" | "ogg" | "flac";
  model?: string;
};

export async function generateSpeech(
  text: string,
  options: SpeechGenerationOptions = {},
): Promise<{ buffer: Buffer; mimeType: string; voice: string } | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  const voice = options.voice ?? "alloy";
  const format = options.format ?? "mp3";
  const model = options.model ?? "gpt-4o-mini-tts";

  try {
    const response = await client.audio.speech.create({
      model,
      voice,
      input: text,
      ...(format !== "mp3" ? { response_format: format } : {}),
    } as any);

    // In Node.js SDK, response is a Web API Response-like object
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mimeType =
      format === "wav"
        ? "audio/wav"
        : format === "ogg"
          ? "audio/ogg"
          : format === "flac"
            ? "audio/flac"
            : "audio/mpeg";

    return { buffer, mimeType, voice };
  } catch (error) {
    console.error("[ai] Error generating speech", error);
    return null;
  }
}

/**
 * Extrait le texte d'une image ou d'un PDF en utilisant OpenAI Vision
 */
export async function extractTextWithVision(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) {
    console.warn("[openai-vision] OpenAI client not available");
    return null;
  }

  try {
    // Convertir le buffer en base64
    const base64Image = imageBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o", // gpt-4o supporte les images
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrais tout le texte visible dans cette image ou ce document. Retourne uniquement le texte extrait, sans commentaires ni explications. Préserve la structure et les sauts de ligne du texte original.",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
    });

    const extractedText = response.choices[0]?.message?.content;
    if (!extractedText) {
      console.log("[openai-vision] No text extracted");
      return null;
    }

    console.log("[openai-vision] Text extracted successfully, length:", extractedText.length);
    return extractedText.trim();
  } catch (error) {
    console.error("[openai-vision] Error extracting text:", error);
    return null;
  }
}

