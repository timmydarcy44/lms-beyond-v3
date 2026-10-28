import { NextRequest, NextResponse } from "next/server";
import { rescoreAllSeoPages } from "@/lib/seo/persist-score";
import { refreshStaleHeadings } from "@/lib/seo/refresh-headings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const headings = await refreshStaleHeadings(8);
    const result = await rescoreAllSeoPages();
    return NextResponse.json({ ok: true, headings, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recalcul impossible" },
      { status: 500 },
    );
  }
}
