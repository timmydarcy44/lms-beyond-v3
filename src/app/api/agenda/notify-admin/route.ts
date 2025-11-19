import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, learnerName, learnerEmail, appointmentTime, subject, notes } = body;

    if (!appointmentId || !learnerName || !learnerEmail || !appointmentTime) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Service client non disponible" }, { status: 500 });
    }

    // Récupérer l'email de contentin.cabinet@gmail.com
    const { data: contentinProfile } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("email", "contentin.cabinet@gmail.com")
      .single();

    if (!contentinProfile) {
      return NextResponse.json({ error: "Super admin non trouvé" }, { status: 404 });
    }

    // Construire le message
    const subjectEmail = "Nouvelle réservation de rendez-vous";
    const message = `Bonjour,

Une nouvelle réservation de rendez-vous a été effectuée :

**Apprenant :**
- Nom : ${learnerName}
- Email : ${learnerEmail}

**Rendez-vous :**
- Date et heure : ${new Date(appointmentTime).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}

${subject ? `**Sujet :** ${subject}` : ""}

${notes ? `**Notes de l'apprenant :**\n${notes}` : ""}

Vous pouvez consulter ce rendez-vous dans votre agenda super admin.

Cordialement,
L'équipe Beyond`;

    // Envoyer l'email (via Resend si configuré)
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "noreply@beyond-lms.com",
            to: contentinProfile.email,
            subject: subjectEmail,
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
      appointment_id: appointmentId,
      notification_type: "confirmation",
      sent_via: emailSent ? "email" : "pending",
      recipient_email: contentinProfile.email,
      message_content: message,
      status: emailSent ? "sent" : "pending",
    });

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent ? "Notification envoyée avec succès" : "Notification enregistrée (email non configuré)",
    });
  } catch (error: any) {
    console.error("[agenda] Error notifying admin:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de l'envoi de la notification" }, { status: 500 });
  }
}

