import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildIndicatorProofPdf } from "@/lib/qualiopi/indicator-proof-pdf";
import type { QualiopiStatusSnapshot } from "@/lib/qualiopi/status-types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/** PDF preuve pour un indicateur Qualiopi (1–32), design Revolut. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: raw } = await ctx.params;
  const indicatorId = Number(raw);
  if (!Number.isFinite(indicatorId) || indicatorId < 1 || indicatorId > 32) {
    return NextResponse.json({ error: "Indicateur invalide" }, { status: 400 });
  }

  const { buildStatusForEvidence } = await import(
    "@/app/api/super-admin/crm/qualiopi/status/route"
  );
  const snapshot = (await buildStatusForEvidence(false)) as QualiopiStatusSnapshot | null;
  if (!snapshot) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const indicator = snapshot.indicators.find((i) => i.indicatorId === indicatorId);
  if (!indicator) {
    return NextResponse.json({ error: "Indicateur introuvable" }, { status: 404 });
  }

  try {
    const pdf = await buildIndicatorProofPdf({
      indicator,
      generatedAtIso: snapshot.generatedAt || new Date().toISOString(),
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="qualiopi-ind-${indicatorId}-preuve.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Génération PDF impossible" },
      { status: 500 },
    );
  }
}
