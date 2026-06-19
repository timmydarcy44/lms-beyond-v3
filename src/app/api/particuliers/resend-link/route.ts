import { NextRequest, NextResponse } from "next/server";
import { sendParticulierConfirmationLink } from "@/lib/particuliers/send-confirmation-link";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible." }, { status: 500 });
    }

    const result = await sendParticulierConfirmationLink(supabase, request, email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: "Un nouvel email de confirmation vient de vous être envoyé. Consultez votre boîte mail.",
    });
  } catch (error) {
    console.error("[particuliers/resend-link] unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
