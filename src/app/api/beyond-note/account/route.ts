import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("beyond_note_accounts")
      .select("account_type")
      .eq("user_id", session.id)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ account_type: "solo" });
      }
      return NextResponse.json(
        { error: "Erreur lors de la récupération", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ account_type: data?.account_type || "solo" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
