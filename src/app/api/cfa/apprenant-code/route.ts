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
    return NextResponse.json(
      { error: zodMessage(parsed.error, "Cette adresse e-mail n'est pas valide.") },
      { status: 400 },
    );
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const email = parsed.data.email;
  const profile = await db
    .from("profiles")
    .select("id, first_name, last_name, email")
    .ilike("email", email)
    .maybeSingle();
  const application = await db
    .from("cfa_applications")
    .select("id, first_name, last_name, email, status")
    .ilike("email", email)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const person = (profile.data as { first_name?: string | null; last_name?: string | null } | null) ?? null;
  const app = (application.data as { first_name?: string | null; last_name?: string | null; status?: string } | null) ?? null;
  if (!person && !app) {
    return NextResponse.json({ error: "Aucun dossier apprenant n'est ouvert pour cette adresse." }, { status: 404 });
  }

  const sent = await sendAccessCode(db, {
    email,
    role: "apprenant",
    context: "apprenant_login",
    firstName: String(person?.first_name || app?.first_name || ""),
    lastName: String(person?.last_name || app?.last_name || ""),
  });
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error, retryAfter: sent.retryAfter },
      { status: sent.retryAfter ? 429 : 502 },
    );
  }
  return NextResponse.json({ ok: true, digits: sent.digits || 8 });
}
