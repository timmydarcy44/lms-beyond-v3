import { NextRequest, NextResponse } from "next/server";
import { ensureEntrepriseUser, issueEntrepriseCode } from "@/lib/entreprise/signup-code";
import { resolveEntrepriseAppOrigin } from "@/lib/entreprise/signup-redirect";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  entrepriseSignupSchema,
  signupFieldErrors,
  suggestProfessionalEmail,
} from "@/lib/entreprise/signup-fields";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = entrepriseSignupSchema.safeParse(body);
    if (!parsed.success) {
      const fields = signupFieldErrors(parsed.error);
      const email = String(body?.email ?? "");
      return NextResponse.json(
        {
          error: fields.email || fields.company_name || fields.first_name || fields.last_name || "Vérifiez le formulaire.",
          fields,
          suggestion: suggestProfessionalEmail(email),
        },
        { status: 400 },
      );
    }

    const firstName = parsed.data.first_name;
    const lastName = parsed.data.last_name;
    const companyName = parsed.data.company_name;
    const email = parsed.data.email;

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible." }, { status: 500 });
    }

    const prepared = await ensureEntrepriseUser(supabase, {
      email,
      firstName,
      lastName,
      company: companyName,
    });
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.error }, { status: prepared.status });
    }
    if (prepared.hint === "password") {
      return NextResponse.json({ step: "password" });
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("email", email).maybeSingle();
    const mode = prepared.hint === "unknown" || !profile?.company_id ? "signup" : "login";
    const issued = await issueEntrepriseCode(supabase, {
      email,
      firstName,
      lastName,
      company: companyName,
      mode,
      redirectTo: resolveEntrepriseAppOrigin(request),
    });
    if (!issued.ok) {
      return NextResponse.json({ error: issued.error, retryAfter: issued.retryAfter }, { status: issued.status });
    }

    return NextResponse.json({ step: "code", digits: issued.digits });
  } catch (error) {
    console.error("[entreprises/signup] unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
