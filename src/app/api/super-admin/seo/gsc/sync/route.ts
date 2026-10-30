import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { gscIsConfigured } from "@/lib/seo/gsc-auth";
import { syncSearchConsole } from "@/lib/seo/gsc-sync";

const bodySchema = z.object({ full: z.boolean().optional() }).optional();

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (!gscIsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Ajoutez GSC_PROPERTY (sc-domain:byound.fr), GSC_CLIENT_EMAIL et GSC_PRIVATE_KEY. Invitez le compte de service dans Search Console (propriété de domaine byound.fr).",
      },
      { status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  try {
    const result = await syncSearchConsole({ full: parsed.success ? parsed.data?.full : false });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Synchronisation impossible" }, { status: 500 });
  }
}
