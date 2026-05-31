import { NextRequest, NextResponse } from "next/server";
import { validateMcpApiKey } from "@/lib/mcp-auth";
import {
  createPipelineBtobDeal,
  listPipelineBtobDeals,
  type McpPipelineBtobInput,
} from "@/lib/crm/pipeline-btob-mcp";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = validateMcpApiKey(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      priority: searchParams.get("priority"),
      sector: searchParams.get("sector"),
      status: searchParams.get("status"),
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
      next_action_before: searchParams.get("next_action_before"),
    };

    const prospects = await listPipelineBtobDeals(filters);
    return NextResponse.json({
      prospects,
      total: prospects.length,
      filters_applied: Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v != null && v !== ""),
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = validateMcpApiKey(request);
  if (authError) return authError;

  try {
    const body = (await request.json().catch(() => null)) as McpPipelineBtobInput | null;
    if (!body?.company_name) {
      return NextResponse.json({ error: "company_name est requis" }, { status: 400 });
    }
    const prospect = await createPipelineBtobDeal({
      ...body,
      source: body.source ?? "claude",
    });
    return NextResponse.json({ prospect, created: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
