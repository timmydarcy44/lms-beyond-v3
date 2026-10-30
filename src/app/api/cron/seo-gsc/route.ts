import { NextRequest, NextResponse } from "next/server";
import { gscIsConfigured } from "@/lib/seo/gsc-auth";
import { syncSearchConsole } from "@/lib/seo/gsc-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!gscIsConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Search Console non configurée" });
  }
  try {
    const full = request.nextUrl.searchParams.get("full") === "1";
    const result = await syncSearchConsole({ full });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sync GSC impossible" }, { status: 500 });
  }
}
