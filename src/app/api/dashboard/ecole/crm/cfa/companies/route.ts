import { NextResponse } from "next/server";

import { canReadCfaCrm } from "@/lib/cfa/cfa-crm-access";
import { loadCfaCompanies } from "@/lib/cfa/load-cfa-crm";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await canReadCfaCrm())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const board = await loadCfaCompanies(db);
  if ("error" in board && board.error) return NextResponse.json({ error: board.error }, { status: 400 });
  return NextResponse.json(board);
}
