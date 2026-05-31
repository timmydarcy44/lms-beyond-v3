import { NextRequest, NextResponse } from "next/server";
import { validateMcpApiKey } from "@/lib/mcp-auth";
import { updatePipelineBtobDeal, type McpPipelineBtobInput } from "@/lib/crm/pipeline-btob-mcp";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const authError = validateMcpApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => null)) as McpPipelineBtobInput | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }
    const prospect = await updatePipelineBtobDeal(id, body);
    return NextResponse.json({ prospect, updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
