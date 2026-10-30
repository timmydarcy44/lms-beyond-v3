import { NextRequest, NextResponse } from "next/server";
import { issueEntrepriseCode, readLoginHint } from "@/lib/entreprise/signup-code";
import { resolveEntrepriseAppOrigin } from "@/lib/entreprise/signup-redirect";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Cette adresse email n'est pas valide." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const email = parsed.data.email;
  const hint = await readLoginHint(db, email);
  if (!hint) {
    return NextResponse.json({ error: "La vérification par code n'est pas encore activée." }, { status: 503 });
  }
  if (hint === "password") return NextResponse.json({ step: "password" });
  if (hint === "unknown") return NextResponse.json({ step: "code", digits: 8 });

  const { data: profile } = await db
    .from("profiles")
    .select("first_name, last_name, company_id")
    .eq("email", email)
    .maybeSingle();
  const issued = await issueEntrepriseCode(db, {
    email,
    firstName: String(profile?.first_name ?? ""),
    lastName: String(profile?.last_name ?? ""),
    company: "",
    mode: "login",
    redirectTo: resolveEntrepriseAppOrigin(request),
  });
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error, retryAfter: issued.retryAfter }, { status: issued.status });
  }
  return NextResponse.json({ step: "code", digits: issued.digits });
}
