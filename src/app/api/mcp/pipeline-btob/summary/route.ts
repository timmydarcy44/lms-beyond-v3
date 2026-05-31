import { NextRequest, NextResponse } from "next/server";
import { validateMcpApiKey } from "@/lib/mcp-auth";
import { getPipelineBtobSummary } from "@/lib/crm/pipeline-btob-mcp";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = validateMcpApiKey(request);
  if (authError) return authError;

  try {
    const summary = await getPipelineBtobSummary();
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
