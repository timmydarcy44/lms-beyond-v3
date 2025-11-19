"use server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export type Alert = {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  entityId?: string;
  entityType?: "organization" | "user" | "course" | "path";
};

export async function getSuperAdminAlerts(): Promise<Alert[]> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) return [];

  let supabase = await getServerClient();
  if (isAdmin) {
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = getServiceRoleClient();
      }
    } catch (e) {
      if (!supabase) return [];
    }
  } else if (!supabase) {
    return [];
  }

  if (!supabase) {
    return [];
  }

  const alerts: Alert[] = [];

  try {
    // 1. Organisations inactives (> 30 jours sans activité)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Vérifier l'activité via login_events pour les membres
    const { data: recentLogins } = await supabase
      .from("login_events")
      .select("user_id, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { data: allOrgs } = await supabase
      .from("organizations")
      .select("id, name, created_at");

    if (allOrgs) {

      const activeUserIds = new Set(recentLogins?.map(l => l.user_id) || []);

      // Pour chaque org, vérifier si au moins un membre est actif
      for (const org of allOrgs) {
        const { data: orgMembers } = await supabase
          .from("org_memberships")
          .select("user_id")
          .eq("org_id", org.id);

        const hasActiveMember = orgMembers?.some(om => activeUserIds.has(om.user_id));

        if (!hasActiveMember && org.created_at) {
          const orgCreatedAt = new Date(org.created_at);
          if (orgCreatedAt < thirtyDaysAgo) {
            alerts.push({
              id: `inactive-org-${org.id}`,
              type: "warning",
              title: `Organisation inactive : ${org.name}`,
              description: "Aucune activité depuis plus de 30 jours",
              severity: "medium",
              createdAt: new Date().toISOString(),
              entityId: org.id,
              entityType: "organization",
            });
          }
        }
      }
    }

    // 2. Utilisateurs à risque de churn (> 30 jours inactifs)
    const { data: allUsers } = await supabase
      .from("profiles")
      .select("id, email, full_name");

    if (allUsers && recentLogins) {
      const userLastLogin = new Map<string, Date>();
      recentLogins?.forEach((login: { user_id: string; created_at: string }) => {
        const existing = userLastLogin.get(login.user_id);
        const loginDate = new Date(login.created_at);
        if (!existing || loginDate > existing) {
          userLastLogin.set(login.user_id, loginDate);
        }
      });

      for (const user of allUsers) {
        const lastLogin = userLastLogin.get(user.id);
        if (!lastLogin || lastLogin < thirtyDaysAgo) {
          alerts.push({
            id: `churn-risk-${user.id}`,
            type: "warning",
            title: `Utilisateur à risque : ${user.full_name || user.email}`,
            description: "Inactif depuis plus de 30 jours",
            severity: "low",
            createdAt: new Date().toISOString(),
            entityId: user.id,
            entityType: "user",
          });
        }
      }
    }

    // 3. Taux de complétion anormalement bas (< 20%)
    const { data: courseProgress } = await supabase
      .from("course_progress")
      .select("course_id, progress_percent");

    if (courseProgress) {
      const courseMetrics = new Map<string, { total: number; sum: number }>();
      courseProgress.forEach(cp => {
        const existing = courseMetrics.get(cp.course_id) || { total: 0, sum: 0 };
        existing.total++;
        existing.sum += Number(cp.progress_percent) || 0;
        courseMetrics.set(cp.course_id, existing);
      });

      for (const [courseId, metrics] of courseMetrics.entries()) {
        const avgCompletion = metrics.sum / metrics.total;
        if (avgCompletion < 20 && metrics.total >= 3) { // Au moins 3 tentatives
          const { data: course } = await supabase
            .from("courses")
            .select("title")
            .eq("id", courseId)
            .single();

          if (course) {
            alerts.push({
              id: `low-completion-${courseId}`,
              type: "info",
              title: `Taux de complétion faible : ${course.title}`,
              description: `Taux de complétion moyen de ${avgCompletion.toFixed(1)}%`,
              severity: "low",
              createdAt: new Date().toISOString(),
              entityId: courseId,
              entityType: "course",
            });
          }
        }
      }
    }

    // Trier par sévérité (high > medium > low)
    alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    return alerts.slice(0, 50); // Limiter à 50 alertes
  } catch (error) {
    console.error("[alerts] Error fetching alerts:", error);
    return [];
  }
}

export async function getAlertCount(): Promise<number> {
  const alerts = await getSuperAdminAlerts();
  return alerts.filter(a => a.severity === "high" || a.severity === "medium").length;
}





