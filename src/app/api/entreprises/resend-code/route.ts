import { NextRequest, NextResponse } from "next/server";
import { issueEntrepriseCode } from "@/lib/entreprise/signup-code";
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
  const { data: open } = await db
    .from("signup_requests")
    .select("first_name, last_name, company, mode")
    .eq("email", email)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!open) return NextResponse.json({ step: "code" });

  const issued = await issueEntrepriseCode(db, {
    email,
    firstName: String(open.first_name ?? ""),
    lastName: String(open.last_name ?? ""),
    company: String(open.company ?? ""),
    mode: open.mode === "login" ? "login" : "signup",
    redirectTo: resolveEntrepriseAppOrigin(request),
  });
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error, retryAfter: issued.retryAfter }, { status: issued.status });
  }
  return NextResponse.json({ step: "code" });
}
