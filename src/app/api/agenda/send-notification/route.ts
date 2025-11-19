import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { learnerId, appointmentTime, type } = body;

    if (!learnerId || !appointmentTime || !type) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Récupérer les informations de l'apprenant
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Service client non disponible" }, { status: 500 });
    }

    const { data: learner } = await serviceClient
      .from("profiles")
      .select("id, email, full_name, phone")
      .eq("id", learnerId)
      .single();

    if (!learner) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Récupérer le rendez-vous
    const { data: appointment } = await serviceClient
      .from("appointments")
      .select("*")
      .eq("learner_id", learnerId)
      .eq("start_time", appointmentTime)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous non trouvé" }, { status: 404 });
    }

    // Construire le message selon le type
    let subject = "";
    let message = "";

    if (type === "confirmation") {
      subject = "Confirmation de votre rendez-vous";
      message = `Bonjour ${learner.full_name || "Cher apprenant"},

Votre rendez-vous a été confirmé pour le ${new Date(appointmentTime).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.

${appointment.subject ? `Sujet : ${appointment.subject}` : ""}

Nous vous attendons à cette date.

Cordialement,
L'équipe Beyond`;
    } else if (type === "reminder") {
      subject = "Rappel : Votre rendez-vous approche";
      message = `Bonjour ${learner.full_name || "Cher apprenant"},

Ceci est un rappel : vous avez un rendez-vous prévu le ${new Date(appointmentTime).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.

Nous vous attendons à cette date.

Cordialement,
L'équipe Beyond`;
    } else if (type === "cancellation") {
      subject = "Annulation de votre rendez-vous";
      message = `Bonjour ${learner.full_name || "Cher apprenant"},

Votre rendez-vous prévu le ${new Date(appointmentTime).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} a été annulé.

Nous vous remercions de votre compréhension.

Cordialement,
L'équipe Beyond`;
    }

    // Envoyer l'email (via Resend si configuré)
    let emailSent = false;
    if (process.env.RESEND_API_KEY && learner.email) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "noreply@beyond-lms.com",
            to: learner.email,
            subject,
            text: message,
          }),
        });

        emailSent = resendResponse.ok;
      } catch (error) {
        console.error("Error sending email:", error);
      }
    }

    // Enregistrer la notification
    await serviceClient.from("appointment_notifications").insert({
      appointment_id: appointment.id,
      notification_type: type,
      sent_via: emailSent ? "email" : "pending",
      recipient_email: learner.email || null,
      recipient_phone: learner.phone || null,
      message_content: message,
      status: emailSent ? "sent" : "pending",
    });

    // Mettre à jour le rendez-vous
    await serviceClient
      .from("appointments")
      .update({
        email_sent: emailSent,
        reminder_sent: type === "reminder" ? true : appointment.reminder_sent,
      })
      .eq("id", appointment.id);

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent ? "Notification envoyée avec succès" : "Notification enregistrée (email non configuré)",
    });
  } catch (error: any) {
    console.error("[agenda] Error sending notification:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de l'envoi de la notification" }, { status: 500 });
  }
}

