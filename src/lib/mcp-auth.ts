import { NextRequest, NextResponse } from "next/server";

export function validateMcpApiKey(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get("x-api-key");
  const expected = process.env.BEYOND_MCP_API_KEY?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "BEYOND_MCP_API_KEY non configurée sur le serveur" },
      { status: 503 },
    );
  }
  if (!apiKey || apiKey !== expected) {
    return NextResponse.json(
      { error: "Non autorisé — clé API manquante ou invalide" },
      { status: 401 },
    );
  }
  return null;
}
