import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, learnerName, learnerEmail, appointmentTime, subject, notes } = body;

    if (!appointmentId || !learnerName || !appointmentTime) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }
    // learnerEmail peut être null si l'utilisateur n'est pas connecté

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

    // Construire le message pour contentin.cabinet@gmail.com
    const subjectEmailAdmin = "Nouvelle réservation de rendez-vous";
    const messageAdmin = `Bonjour,

Une nouvelle réservation de rendez-vous a été effectuée :

**Apprenant :**
- Nom : ${learnerName}
${learnerEmail ? `- Email : ${learnerEmail}` : "- Email : Non renseigné (réservation sans compte)"}

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

    // Construire le message pour l'apprenant (si email disponible)
    let messageLearner = "";
    if (learnerEmail) {
      messageLearner = `Bonjour ${learnerName},

Votre réservation de rendez-vous a été confirmée :

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

${notes ? `**Vos notes :**\n${notes}` : ""}

Nous vous attendons à cette date.

Cordialement,
Jessica Contentin
Professeur certifié et psychopédagogue`;
    }

    // Envoyer les emails (via Resend si configuré)
    let emailSentAdmin = false;
    let emailSentLearner = false;
    
    if (process.env.RESEND_API_KEY) {
      try {
        // Email à contentin.cabinet@gmail.com
        const resendResponseAdmin = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "noreply@beyond-lms.com",
            to: contentinProfile.email,
            subject: subjectEmailAdmin,
            text: messageAdmin,
          }),
        });

        emailSentAdmin = resendResponseAdmin.ok;

        // Email à l'apprenant (si email disponible)
        if (learnerEmail && messageLearner) {
          const resendResponseLearner = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "noreply@beyond-lms.com",
              to: learnerEmail,
              subject: "Confirmation de votre rendez-vous",
              text: messageLearner,
            }),
          });

          emailSentLearner = resendResponseLearner.ok;
        }
      } catch (error) {
        console.error("Error sending email:", error);
      }
    }

    // Enregistrer les notifications
    const notificationsToInsert: any[] = [
      {
        appointment_id: appointmentId,
        notification_type: "confirmation",
        sent_via: emailSentAdmin ? "email" : "pending",
        recipient_email: contentinProfile.email,
        message_content: messageAdmin,
        status: emailSentAdmin ? "sent" : "pending",
      },
    ];

    if (learnerEmail) {
      notificationsToInsert.push({
        appointment_id: appointmentId,
        notification_type: "confirmation",
        sent_via: emailSentLearner ? "email" : "pending",
        recipient_email: learnerEmail,
        message_content: messageLearner,
        status: emailSentLearner ? "sent" : "pending",
      });
    }

    await serviceClient.from("appointment_notifications").insert(notificationsToInsert);

    return NextResponse.json({
      success: true,
      emailSentAdmin,
      emailSentLearner: learnerEmail ? emailSentLearner : null,
      message: emailSentAdmin 
        ? (learnerEmail && emailSentLearner 
          ? "Notifications envoyées avec succès (admin et apprenant)" 
          : learnerEmail 
            ? "Notification envoyée à l'admin (erreur pour l'apprenant)" 
            : "Notification envoyée à l'admin")
        : "Notifications enregistrées (email non configuré)",
    });
  } catch (error: any) {
    console.error("[agenda] Error notifying admin:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de l'envoi de la notification" }, { status: 500 });
  }
}
