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
      .select("account_type,onboarding_completed,onboarding_step")
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

    return NextResponse.json({
      account_type: data?.account_type || "solo",
      account: {
        onboarding_completed: data?.onboarding_completed ?? false,
        onboarding_step: data?.onboarding_step ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { onboarding_completed, onboarding_step } = body || {};

    const updates: Record<string, unknown> = {
      user_id: session.id,
      updated_at: new Date().toISOString(),
    };

    if (typeof onboarding_completed !== "undefined") {
      updates.onboarding_completed = onboarding_completed;
    }
    if (typeof onboarding_step !== "undefined") {
      updates.onboarding_step = onboarding_step;
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("beyond_note_accounts")
      .upsert(updates, { onConflict: "user_id" })
      .select("account_type,onboarding_completed,onboarding_step")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      account_type: data?.account_type || "solo",
      account: {
        onboarding_completed: data?.onboarding_completed ?? false,
        onboarding_step: data?.onboarding_step ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
