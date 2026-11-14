import { NextRequest, NextResponse } from "next/server";
import { writeDisabilityAccessLog } from "@/lib/handicap/access-log";
import { loadDisabilityRegistre } from "@/lib/handicap/registre-data";
import { buildDisabilityRegistrePdf } from "@/lib/handicap/registre-pdf";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) return NextResponse.json({ error: "Non autorisé" }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const rows = await loadDisabilityRegistre(service);
  const format = req.nextUrl.searchParams.get("format");

  if (format === "pdf") {
    const pdf = await buildDisabilityRegistrePdf(rows);
    // Journal : une ligne par dossier présent (sans contenu nominatif).
    await Promise.all(
      rows.map((r) =>
        writeDisabilityAccessLog(service, {
          caseId: r.caseId,
          actorId: gate.userId,
          action: "export",
        }),
      ),
    );
    const filename = `registre-qualiopi-handicap-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    rows: rows.map(({ caseId: _c, ...rest }) => rest),
    generatedAt: new Date().toISOString(),
  });
}
