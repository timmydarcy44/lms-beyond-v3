import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";
import { MentalHealthAlertEmailTemplate } from "@/lib/email/templates/mental-health-alert";

export async function POST(request: NextRequest) {
  try {
    const isSuper = await isSuperAdmin();
    const supabase = isSuper ? getServiceRoleClient() : await getServerClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { learner_id, message, notification_type = "coach" } = body;

    if (!learner_id) {
      return NextResponse.json(
        { error: "learner_id est requis" },
        { status: 400 }
      );
    }

    // Récupérer les informations de l'apprenant
    const { data: learner } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", learner_id)
      .single();

    if (!learner) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer l'organisation
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", learner_id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Organisation non trouvée pour cet apprenant" },
        { status: 404 }
      );
    }

    // Récupérer les coaches/responsables de performance de l'organisation
    // Pour le PSG, cela pourrait être des rôles spécifiques comme "coach" ou "performance_manager"
    const { data: coaches } = await supabase
      .from("org_memberships")
      .select(`
        user_id,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq("org_id", membership.org_id)
      .in("role", ["instructor", "tutor", "admin"]);

    // Récupérer le score de l'apprenant pour l'inclure dans l'email
    const { data: latestIndicator } = await supabase
      .from("mental_health_indicators")
      .select("indicator_value, indicator_label")
      .eq("user_id", learner_id)
      .eq("indicator_type", "overall_wellbeing")
      .order("calculated_at", { ascending: false })
      .limit(1)
      .single();

    const score = latestIndicator?.indicator_value || 0;
    const level = latestIndicator?.indicator_label || "Non disponible";

    // Créer une notification dans la table todo_tasks pour chaque coach
    const notifications = [];
    if (coaches && coaches.length > 0) {
      for (const coach of coaches) {
        const coachProfile = coach.profiles as any;
        const coachEmail = coachProfile?.email;
        const coachName = coachProfile?.full_name || coachEmail;
        
        // Créer une tâche pour le coach
        const { data: task, error: taskError } = await supabase
          .from("todo_tasks")
          .insert({
            title: `Alerte santé mentale - ${learner.full_name || learner.email}`,
            description: message || `L'apprenant ${learner.full_name || learner.email} a un score de ${score.toFixed(1)}% (${level}). Une attention est requise.`,
            status: "todo",
            priority: "high",
            task_type: "mental_health_alert",
            assigned_to: coach.user_id,
            created_by: user.id,
            metadata: {
              learner_id,
              learner_name: learner.full_name || learner.email,
              learner_email: learner.email,
              score,
              level,
              notification_type,
              alert_date: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (!taskError && task) {
          notifications.push({
            coach_id: coach.user_id,
            coach_name: coachName,
            coach_email: coachEmail,
            task_id: task.id,
          });

          // Envoyer un email au coach
          if (coachEmail) {
            const emailHtml = MentalHealthAlertEmailTemplate({
              learnerName: learner.full_name || learner.email,
              learnerEmail: learner.email,
              score,
              level,
              message: message || `L'apprenant ${learner.full_name || learner.email} nécessite une attention concernant sa santé mentale.`,
              coachName,
            });

            const emailResult = await sendEmail({
              to: coachEmail,
              subject: `🚨 Alerte Santé Mentale - ${learner.full_name || learner.email}`,
              html: emailHtml,
            });

            if (!emailResult.success) {
              console.error(`[mental-health/notify-coach] Error sending email to ${coachEmail}:`, emailResult.error);
            }
          }
        }
      }
    }

    const emailsSent = notifications.filter((n) => n.coach_email).length;

    return NextResponse.json({
      success: true,
      notifications_sent: notifications.length,
      emails_sent: emailsSent,
      notifications,
    });
  } catch (error) {
    console.error("[mental-health/notify-coach] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}

