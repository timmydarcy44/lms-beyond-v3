import { NextRequest, NextResponse } from "next/server";
import { runBusinessDev } from "@/lib/cfa/business-dev";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Indisponible" }, { status: 503 });
  const result = await runBusinessDev(db);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
