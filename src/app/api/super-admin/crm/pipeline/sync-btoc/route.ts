import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { syncBtocPipelineDeals } from "@/lib/crm/btoc-pipeline-sync";

export async function POST() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const result = await syncBtocPipelineDeals();
  return NextResponse.json(result);
}
