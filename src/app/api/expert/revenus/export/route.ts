import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { formatEuros, monthKey, revenueForMonth, revenueLinesFromMissions } from "@/lib/expert/space-model";
import { loadExpertSpace } from "@/lib/expert/space-server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const month = request.nextUrl.searchParams.get("m") || monthKey(new Date());
  const space = await loadExpertSpace();
  const report = revenueForMonth(revenueLinesFromMissions(space.missions), month);
  const lines = [...report.paid, ...report.upcoming];
  const csv = ["titre;client;date;montant;statut", ...lines.map((line) => `${line.title};${line.client};${line.at.slice(0, 10)};${formatEuros(line.amountCents)};${line.pill}`)].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="revenus-${month}.csv"`,
    },
  });
}
