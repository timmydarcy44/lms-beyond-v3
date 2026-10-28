import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateSeoProposals } from "@/lib/seo/generate-proposals";
import { seoFaqSchema } from "@/lib/seo/seo-fields";

const bodySchema = z.object({
  path: z.string().min(1),
  batch_id: z.string().uuid().optional(),
  current: z
    .object({
      title: z.string().optional(),
      meta_description: z.string().optional(),
      focus_keyword: z.string().optional(),
      ai_summary: z.string().optional(),
      faq: z.array(seoFaqSchema).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const path = parsed.data.path.trim();
  if (!path.startsWith("/")) return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  try {
    const result = await generateSeoProposals({
      path,
      batchId: parsed.data.batch_id,
      current: parsed.data.current,
    });
    if (!result.proposals.length) {
      return NextResponse.json(
        { error: "Aucune proposition fiable (faits manquants ou chiffres inventés écartés).", skipped: result.skipped },
        { status: 422 },
      );
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Génération impossible" }, { status: 503 });
  }
}
