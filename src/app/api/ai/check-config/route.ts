import { NextRequest, NextResponse } from "next/server";

/**
 * Route pour vérifier la configuration des clés API IA
 */
export async function GET(request: NextRequest) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const config = {
    anthropic: {
      configured: !!anthropicKey,
      keyLength: anthropicKey?.length || 0,
      valid: anthropicKey ? anthropicKey.length > 10 : false,
    },
    openai: {
      configured: !!openaiKey,
      keyLength: openaiKey?.length || 0,
      valid: openaiKey ? openaiKey.length > 10 : false,
    },
  };

  return NextResponse.json(config);
}
