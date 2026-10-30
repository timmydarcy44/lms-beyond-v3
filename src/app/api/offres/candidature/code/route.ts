import { NextResponse } from "next/server";
import { z } from "zod";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email(),
  firstName: z.string().trim().max(80).optional().default(""),
  lastName: z.string().trim().max(80).optional().default(""),
  slug: z.string().trim().regex(/^[a-z0-9-]{3,80}$/i),
  login: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Indiquez un e-mail valide." }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const email = parsed.data.email.toLowerCase();
  if (parsed.data.login) {
    const profile = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (!profile.data) {
      return NextResponse.json({ error: "Aucun compte avec cette adresse. Créez votre espace." }, { status: 404 });
    }
  } else if (!parsed.data.firstName || !parsed.data.lastName) {
    return NextResponse.json({ error: "Le prénom et le nom sont requis." }, { status: 400 });
  }

  const offer = await db.from("job_offers").select("id, public_status, status").eq("public_slug", parsed.data.slug).maybeSingle();
  const row = offer.data as { status?: string | null; public_status?: string | null } | null;
  if (!row || row.status !== "active" || row.public_status === "blocked") {
    return NextResponse.json({ error: "Cette offre n'est plus disponible." }, { status: 404 });
  }

  const sent = await sendAccessCode(db, {
    email,
    role: "apprenant",
    context: "candidat",
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    offerSlug: parsed.data.slug,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error, retryAfter: sent.retryAfter }, { status: sent.retryAfter ? 429 : 502 });
  }
  return NextResponse.json({ ok: true, digits: sent.digits ?? 8 });
}
