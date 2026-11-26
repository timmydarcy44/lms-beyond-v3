import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildIndicatorProofPdf } from "@/lib/qualiopi/indicator-proof-pdf";
import type { QualiopiIndicatorStatus, QualiopiStatusSnapshot } from "@/lib/qualiopi/status-types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

function parseIndicatorId(raw: string): number | null {
  const indicatorId = Number(raw);
  if (!Number.isFinite(indicatorId) || indicatorId < 1 || indicatorId > 33) return null;
  return indicatorId;
}

async function loadIndicatorFromStatus(indicatorId: number): Promise<QualiopiIndicatorStatus | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") || "https";
  const cookie = h.get("cookie") || "";
  const res = await fetch(`${proto}://${host}/api/super-admin/crm/qualiopi/status`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const snapshot = (await res.json()) as QualiopiStatusSnapshot;
  return snapshot.indicators?.find((i) => i.indicatorId === indicatorId) ?? null;
}

async function pdfResponse(indicator: QualiopiIndicatorStatus) {
  try {
    const pdf = await buildIndicatorProofPdf({
      indicator,
      generatedAtIso: new Date().toISOString(),
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="qualiopi-ind-${indicator.indicatorId}-preuve.pdf"`,
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

/** GET — charge le statut serveur puis génère le PDF. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: raw } = await ctx.params;
  const indicatorId = parseIndicatorId(raw);
  if (indicatorId == null) {
    return NextResponse.json({ error: "Indicateur invalide" }, { status: 400 });
  }

  const indicator = await loadIndicatorFromStatus(indicatorId);
  if (!indicator) {
    return NextResponse.json(
      { error: "Indicateur introuvable (statut Qualiopi indisponible)" },
      { status: 404 },
    );
  }

  return pdfResponse(indicator);
}

/**
 * POST — le client envoie l’indicateur déjà chargé dans l’UI
 * (évite un second rebuild statut / import de route).
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: raw } = await ctx.params;
  const indicatorId = parseIndicatorId(raw);
  if (indicatorId == null) {
    return NextResponse.json({ error: "Indicateur invalide" }, { status: 400 });
  }

  let body: { indicator?: QualiopiIndicatorStatus } = {};
  try {
    body = (await req.json()) as { indicator?: QualiopiIndicatorStatus };
  } catch {
    body = {};
  }

  const fromBody = body.indicator;
  if (fromBody && fromBody.indicatorId === indicatorId) {
    return pdfResponse(fromBody);
  }

  const indicator = await loadIndicatorFromStatus(indicatorId);
  if (!indicator) {
    return NextResponse.json(
      { error: "Indicateur introuvable — rouvrez Qualiopi puis réessayez" },
      { status: 404 },
    );
  }
  return pdfResponse(indicator);
}
