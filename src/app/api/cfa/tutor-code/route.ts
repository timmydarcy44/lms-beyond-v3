import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { zodMessage } from "@/lib/cfa/fiche-input";
import { getServiceRoleClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Cette adresse e-mail n'est pas valide."),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: zodMessage(parsed.error, "Cette adresse e-mail n'est pas valide.") }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const tutor = await db
    .from("company_tutors")
    .select("first_name, last_name, email")
    .ilike("email", parsed.data.email)
    .limit(1)
    .maybeSingle();
  const row = tutor.data as { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
  if (tutor.error || !row?.email) {
    return NextResponse.json({ error: "Aucun espace tuteur n'est ouvert pour cette adresse." }, { status: 404 });
  }

  const sent = await sendAccessCode(db, {
    email: row.email,
    role: "tuteur",
    context: "tuteur_login",
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: sent.retryAfter ? 429 : 502 });
  }
  return NextResponse.json({ ok: true, digits: sent.digits || 8 });
}
