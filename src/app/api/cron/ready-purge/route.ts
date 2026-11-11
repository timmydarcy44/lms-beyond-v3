import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { purgeExpiredReadyLinks } from "@/lib/ready/lifecycle";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Indisponible" }, { status: 503 });

  const result = await purgeExpiredReadyLinks(service, 100);
  return NextResponse.json({ ok: true, ...result });
}
