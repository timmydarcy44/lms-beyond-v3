import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  buildVeilleSyntheseExhaustivePdf,
  buildVeillesRegistrePdf,
} from "@/lib/qualiopi/veilles-pdf";
import type { VeilleDigest, VeilleHighlight } from "@/lib/qualiopi/veille-shared";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Export PDF registre (compact) ou document de synthèse exhaustif (?mode=synthese). */
export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const mode = req.nextUrl.searchParams.get("mode") === "synthese" ? "synthese" : "registre";
  const digestLimit = mode === "synthese" ? 52 : 40;
  const highlightLimit = mode === "synthese" ? 400 : 200;

  const [digestsRes, highlightsRes] = await Promise.all([
    supabase
      .from("crm_qualiopi_veille_digests")
      .select("*")
      .order("week_start", { ascending: false })
      .order("kind")
      .limit(digestLimit),
    supabase
      .from("crm_qualiopi_veille_highlights")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(highlightLimit),
  ]);

  if (digestsRes.error) {
    return NextResponse.json({ error: digestsRes.error.message }, { status: 400 });
  }
  if (highlightsRes.error) {
    return NextResponse.json({ error: highlightsRes.error.message }, { status: 400 });
  }

  try {
    const digests = (digestsRes.data ?? []) as VeilleDigest[];
    const highlights = (highlightsRes.data ?? []) as VeilleHighlight[];
    const pdf =
      mode === "synthese"
        ? await buildVeilleSyntheseExhaustivePdf({ digests, highlights })
        : await buildVeillesRegistrePdf({ digests, highlights });
    const stamp = new Date().toISOString().slice(0, 10);
    const filename =
      mode === "synthese"
        ? `synthese-veille-byound-${stamp}.pdf`
        : `registre-veilles-qualiopi-${stamp}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
