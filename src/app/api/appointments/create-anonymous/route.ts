import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * API route pour créer un rendez-vous anonyme
 * Utilise le service role client pour bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      super_admin_id,
      slot_id,
      start_time,
      end_time,
      subject,
      learner_notes,
      notes,
      email,
    } = body;

    if (!super_admin_id || !slot_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Utiliser le service role client pour bypass RLS
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service client non disponible" },
        { status: 500 }
      );
    }

    // Vérifier que le slot existe et est disponible
    const { data: slot, error: slotError } = await supabase
      .from("appointment_slots")
      .select("*")
      .eq("id", slot_id)
      .eq("is_available", true)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: "Créneau non disponible" },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'y a pas déjà un rendez-vous pour ce slot
    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("slot_id", slot_id)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Ce créneau est déjà réservé" },
        { status: 400 }
      );
    }

    // Créer le rendez-vous avec learner_id = NULL
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        super_admin_id,
        learner_id: null, // Réservation anonyme
        slot_id,
        start_time,
        end_time,
        status: "confirmed",
        subject: subject || null,
        learner_notes: learner_notes || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error("[api/appointments/create-anonymous] Error:", appointmentError);
      return NextResponse.json(
        { error: "Erreur lors de la création du rendez-vous", details: appointmentError.message },
        { status: 500 }
      );
    }

    console.log("[api/appointments/create-anonymous] ✅ Appointment created:", appointment.id);

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error: any) {
    console.error("[api/appointments/create-anonymous] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}




