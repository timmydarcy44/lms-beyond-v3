import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET() {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const service = getServiceRoleClient();
    if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const { data, error } = await service
      .from("edge_accompagnement_reservations")
      .select(
        "id, user_id, user_name, user_email, offer_name, offer_slug, amount_cents, selected_slot, payment_status, status, stripe_checkout_session_id, stripe_payment_intent_id, paid_at, coach_name, created_at, cancelled_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[edge/accompagnement/admin]", error);
      return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
    }

    return NextResponse.json({ reservations: data ?? [] });
  } catch (error) {
    console.error("[edge/accompagnement/admin]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
