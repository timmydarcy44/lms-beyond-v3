import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { submitOfferApplication } from "@/lib/offres/submit-application";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid(),
  share: z.object({
    soft: z.boolean().optional(),
    disc: z.boolean().optional(),
    idmc: z.boolean().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
  const result = await submitOfferApplication(db, {
    userId: session.id,
    applicationId: parsed.data.id,
    share: parsed.data.share ?? {},
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
