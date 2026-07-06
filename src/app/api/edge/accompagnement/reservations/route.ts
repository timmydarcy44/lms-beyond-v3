import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("edge_accompagnement_reservations")
      .select(
        "id, offer_slug, offer_name, amount_cents, duration_label, selected_slot, status, payment_status, paid_at, created_at, coach_name, manage_token",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[edge/accompagnement/reservations] select:", error);
      return NextResponse.json({ error: "Impossible de charger les réservations" }, { status: 500 });
    }

    return NextResponse.json({ reservations: data ?? [] });
  } catch (error) {
    console.error("[edge/accompagnement/reservations] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
