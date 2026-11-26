import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { buildVeillesRegistrePdf } from "@/lib/qualiopi/veilles-pdf";
import type { VeilleDigest, VeilleHighlight } from "@/lib/qualiopi/veille-shared";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Export PDF du registre veilles (ind. 23 / 24 / 25). */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const [digestsRes, highlightsRes] = await Promise.all([
    supabase
      .from("crm_qualiopi_veille_digests")
      .select("*")
      .order("week_start", { ascending: false })
      .order("kind")
      .limit(40),
    supabase
      .from("crm_qualiopi_veille_highlights")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200),
  ]);

  if (digestsRes.error) {
    return NextResponse.json({ error: digestsRes.error.message }, { status: 400 });
  }
  if (highlightsRes.error) {
    return NextResponse.json({ error: highlightsRes.error.message }, { status: 400 });
  }

  try {
    const pdf = await buildVeillesRegistrePdf({
      digests: (digestsRes.data ?? []) as VeilleDigest[],
      highlights: (highlightsRes.data ?? []) as VeilleHighlight[],
    });
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="registre-veilles-qualiopi-${stamp}.pdf"`,
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
