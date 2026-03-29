import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";
import { QuestionnaireReminderEmailTemplate } from "@/lib/email/templates/questionnaire-reminder";

/**
 * API pour envoyer les rappels de questionnaire aux apprenants
 * Cette route peut être appelée par un cron job ou manuellement
 */
export async function POST(request: NextRequest) {
  try {
    const isSuper = await isSuperAdmin();
    const supabase = isSuper ? getServiceRoleClient() : await getServerClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { questionnaire_id, org_id } = body;

    // Récupérer les questionnaires actifs à envoyer aujourd'hui
    const currentDay = new Date().getDay(); // 0 = Dimanche, 5 = Vendredi
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:mm

    let questionnairesQuery = supabase
      .from("mental_health_questionnaires")
      .select(`
        *,
        questions:mental_health_questions(id)
      `)
      .eq("is_active", true)
      .eq("send_day", currentDay)
      .lte("send_time", currentTime);

    if (questionnaire_id) {
      questionnairesQuery = questionnairesQuery.eq("id", questionnaire_id);
    }

    if (org_id) {
      questionnairesQuery = questionnairesQuery.eq("org_id", org_id);
    }

    const { data: questionnaires, error: questionnairesError } = await questionnairesQuery;

    if (questionnairesError) {
      console.error("[mental-health/send-reminders] Error fetching questionnaires:", questionnairesError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des questionnaires" },
        { status: 500 }
      );
    }

    if (!questionnaires || questionnaires.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun questionnaire à envoyer aujourd'hui",
        sent: 0,
      });
    }

    const results = [];

    for (const questionnaire of questionnaires) {
      // Récupérer les apprenants cibles
      const { data: learners } = await supabase
        .from("org_memberships")
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq("org_id", questionnaire.org_id)
        .in("role", questionnaire.target_roles || ["learner"]);

      if (!learners || learners.length === 0) {
        continue;
      }

      let sentCount = 0;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

      for (const learner of learners) {
        const learnerProfile = learner.profiles as any;
        if (!learnerProfile?.email) continue;

        // Vérifier si une notification a déjà été envoyée aujourd'hui
        const today = new Date().toISOString().split("T")[0];
        const { data: existingNotification } = await supabase
          .from("mental_health_notifications")
          .select("id")
          .eq("questionnaire_id", questionnaire.id)
          .eq("user_id", learner.user_id)
          .eq("notification_type", "email")
          .gte("sent_at", `${today}T00:00:00`)
          .lte("sent_at", `${today}T23:59:59`)
          .limit(1)
          .single();

        if (existingNotification) {
          // Déjà envoyé aujourd'hui, skip
          continue;
        }

        // Générer l'URL du questionnaire
        const questionnaireUrl = `${appUrl}/dashboard/apprenant/questionnaires/${questionnaire.id}`;

        // Générer le HTML de l'email
        const emailHtml = QuestionnaireReminderEmailTemplate({
          learnerName: learnerProfile.full_name || learnerProfile.email,
          questionnaireTitle: questionnaire.title,
          questionnaireUrl,
        });

        // Envoyer l'email
        const emailResult = await sendEmail({
          to: learnerProfile.email,
          subject: `📋 Questionnaire de santé mentale - ${questionnaire.title}`,
          html: emailHtml,
        });

        if (emailResult.success) {
          // Enregistrer la notification
          await supabase
            .from("mental_health_notifications")
            .insert({
              questionnaire_id: questionnaire.id,
              user_id: learner.user_id,
              sent_at: new Date().toISOString(),
              notification_type: "email",
            });

          sentCount++;
        } else {
          console.error(
            `[mental-health/send-reminders] Error sending email to ${learnerProfile.email}:`,
            emailResult.error
          );
        }
      }

      results.push({
        questionnaire_id: questionnaire.id,
        questionnaire_title: questionnaire.title,
        sent: sentCount,
        total_learners: learners.length,
      });
    }

    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);

    return NextResponse.json({
      success: true,
      message: `${totalSent} email(s) envoyé(s)`,
      total_sent: totalSent,
      results,
    });
  } catch (error) {
    console.error("[mental-health/send-reminders] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}








