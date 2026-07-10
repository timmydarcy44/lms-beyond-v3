import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  linkAppointmentToPatient,
  pushAppointmentToGoogleCalendar,
} from "@/lib/jessica-contentin/appointment-sync";

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
      first_name,
      last_name,
    } = body;

    if (!super_admin_id || !slot_id || !start_time || !end_time) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service client non disponible" }, { status: 500 });
    }

    const { data: slot, error: slotError } = await supabase
      .from("appointment_slots")
      .select("*")
      .eq("id", slot_id)
      .eq("is_available", true)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Créneau non disponible" }, { status: 400 });
    }

    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("slot_id", slot_id)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (existingAppointment) {
      return NextResponse.json({ error: "Ce créneau est déjà réservé" }, { status: 400 });
    }

    const guestEmail = email ? String(email).toLowerCase() : null;
    const guestName = [first_name, last_name].filter(Boolean).join(" ").trim() || null;

    const patient = guestEmail
      ? await supabase
          .from("jessica_cabinet_patients")
          .select("id")
          .ilike("email", guestEmail)
          .maybeSingle()
      : { data: null };

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        super_admin_id,
        learner_id: null,
        slot_id,
        start_time,
        end_time,
        status: "confirmed",
        subject: subject || null,
        learner_notes: learner_notes || null,
        notes: notes || null,
        guest_email: guestEmail,
        guest_name: guestName,
        cabinet_patient_id: patient.data?.id ?? null,
      })
      .select()
      .single();

    if (appointmentError || !appointment) {
      console.error("[api/appointments/create-anonymous] Error:", appointmentError);
      return NextResponse.json(
        { error: "Erreur lors de la création du rendez-vous", details: appointmentError?.message },
        { status: 500 },
      );
    }

    await linkAppointmentToPatient(supabase, appointment.id, {
      email: guestEmail,
      guestName,
    });

    const googleEventId = await pushAppointmentToGoogleCalendar({
      userId: super_admin_id,
      summary: subject || guestName || "Rendez-vous cabinet",
      description: notes || learner_notes || undefined,
      startIso: start_time,
      endIso: end_time,
      attendeeEmail: guestEmail ?? undefined,
    });

    if (googleEventId) {
      await supabase
        .from("appointments")
        .update({ google_event_id: googleEventId })
        .eq("id", appointment.id);
    }

    return NextResponse.json({
      success: true,
      appointment: { ...appointment, google_event_id: googleEventId },
    });
  } catch (error: unknown) {
    console.error("[api/appointments/create-anonymous] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
