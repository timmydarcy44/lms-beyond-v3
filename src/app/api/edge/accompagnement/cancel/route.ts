import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { sendAccompagnementCancellationEmail } from "@/lib/particulier/accompagnement-emails";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

    const { manageToken } = (await request.json()) as { manageToken?: string };
    if (!manageToken) return NextResponse.json({ error: "Token requis" }, { status: 400 });

    const service = getServiceRoleClient();
    if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const { data: reservation } = await service
      .from("edge_accompagnement_reservations")
      .select("id, user_id, offer_name, selected_slot, user_email, user_name, payment_status, status")
      .eq("manage_token", manageToken)
      .maybeSingle();

    if (!reservation || reservation.user_id !== user.id) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (reservation.payment_status !== "paid" || reservation.status === "cancelled") {
      return NextResponse.json({ error: "Cette réservation ne peut pas être annulée" }, { status: 400 });
    }

    const hoursUntil =
      (new Date(reservation.selected_slot).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24) {
      return NextResponse.json({
        error: "Annulation impossible moins de 24 h avant la séance. Contactez-nous.",
      }, { status: 400 });
    }

    const cancelledAt = new Date().toISOString();
    await service
      .from("edge_accompagnement_reservations")
      .update({
        status: "cancelled",
        payment_status: "cancelled",
        cancelled_at: cancelledAt,
        updated_at: cancelledAt,
      })
      .eq("id", reservation.id);

    await sendAccompagnementCancellationEmail({
      userEmail: reservation.user_email,
      userName: reservation.user_name || reservation.user_email,
      offerName: reservation.offer_name,
      selectedSlot: reservation.selected_slot,
    }).catch((err) => console.error("[accompagnement/cancel] email:", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[edge/accompagnement/cancel]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
