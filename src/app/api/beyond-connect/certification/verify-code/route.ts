import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body ?? {};

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis." }, { status: 400 });
    }

    const expectedCode = process.env.BEYOND_SCHOOL_CODE || "BEYOND";
    if (code !== expectedCode) {
      return NextResponse.json({ error: "Code invalide." }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ is_certified: true })
      .eq("email", email)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile_id: data?.id });
  } catch (error) {
    console.error("[beyond-connect/verify-code] Error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
