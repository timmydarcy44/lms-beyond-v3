import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendOrgTrackedEmail } from "@/lib/email/org-outbound";
import {
  getFormationAssigneeEmail,
  getRhAbandonEmail,
  getRhBadgeSignalEmail,
} from "@/lib/emails/templates/entreprise-activation";
import { ACTIVATION_KINDS } from "@/lib/entreprise/activation-emails";
import { COLLABORATOR_DASHBOARD_PATH } from "@/lib/entreprise/collaborator-invite";
import { publicAppUrl } from "@/lib/env";

const RH_MEMBER_ROLES = new Set(["admin", "owner", "admin_hr", "rh", "entreprise", "manager"]);

async function loadRhEmails(
  db: SupabaseClient,
  orgId: string,
): Promise<Array<{ email: string; firstName: string | null }>> {
  const { data: memberships } = await db
    .from("org_memberships")
    .select("user_id, role")
    .eq("org_id", orgId);
  const ids = (memberships ?? [])
    .filter((m) => RH_MEMBER_ROLES.has(String(m.role ?? "").toLowerCase()))
    .map((m) => String(m.user_id));
  if (!ids.length) return [];
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, first_name, full_name")
    .in("id", ids);
  return (profiles ?? [])
    .map((p) => {
      const email = String(p.email ?? "")
        .trim()
        .toLowerCase();
      if (!email.includes("@")) return null;
      return {
        email,
        firstName:
          String(p.first_name ?? "").trim() ||
          String(p.full_name ?? "").trim().split(/\s+/)[0] ||
          null,
      };
    })
    .filter((x): x is { email: string; firstName: string | null } => Boolean(x));
}

async function resolveOrgForUser(
  db: SupabaseClient,
  userId: string,
): Promise<{ orgId: string; companyName: string; firstName: string | null; email: string } | null> {
  const { data: emp } = await db
    .from("employees")
    .select("email, first_name, company_id")
    .eq("profile_id", userId)
    .maybeSingle();

  let orgId = emp?.company_id ? String(emp.company_id) : "";
  let email = String(emp?.email ?? "")
    .trim()
    .toLowerCase();
  let firstName = String(emp?.first_name ?? "").trim() || null;

  if (!orgId) {
    const { data: membership } = await db
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", userId)
      .limit(5);
    const learner = (membership ?? []).find((m) => String(m.role).toLowerCase() === "learner");
    const any = learner ?? membership?.[0];
    orgId = any?.org_id ? String(any.org_id) : "";
  }

  if (!email || !firstName) {
    const { data: profile } = await db
      .from("profiles")
      .select("email, first_name, full_name, company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!email) {
      email = String(profile?.email ?? "")
        .trim()
        .toLowerCase();
    }
    if (!firstName) {
      firstName =
        String(profile?.first_name ?? "").trim() ||
        String(profile?.full_name ?? "").trim().split(/\s+/)[0] ||
        null;
    }
    if (!orgId && profile?.company_id) orgId = String(profile.company_id);
  }

  if (!orgId || !email.includes("@")) return null;

  const { data: org } = await db.from("organizations").select("name").eq("id", orgId).maybeSingle();
  return {
    orgId,
    companyName: String(org?.name ?? "Votre entreprise"),
    firstName,
    email,
  };
}

/** Post-activation : mail collab quand une formation est assignée. */
export async function notifyFormationAssignedEmails(
  db: SupabaseClient,
  params: { orgId?: string | null; courseId: string; userIds: string[] },
): Promise<{ sent: number }> {
  if (!params.userIds.length) return { sent: 0 };

  const { data: course } = await db
    .from("courses")
    .select("id, title")
    .eq("id", params.courseId)
    .maybeSingle();
  const title = String(course?.title ?? "Formation").trim() || "Formation";
  const base = publicAppUrl().replace(/\/$/, "");
  const formationHref = `${base}${COLLABORATOR_DASHBOARD_PATH}`;

  let sent = 0;
  for (const userId of params.userIds) {
    const resolved = await resolveOrgForUser(db, userId);
    if (!resolved) continue;
    const orgId = params.orgId?.trim() || resolved.orgId;
    const mail = getFormationAssigneeEmail({
      firstName: resolved.firstName,
      companyName: resolved.companyName,
      formationTitle: title,
      formationHref,
    });
    const result = await sendOrgTrackedEmail({
      orgId,
      kind: ACTIVATION_KINDS.formationAssignee,
      label: "Formation assignée",
      to: resolved.email,
      subject: mail.subject,
      html: mail.html,
      from: EDGE_COCKPIT_FROM,
      db,
      meta: { course_id: params.courseId, user_id: userId },
    });
    if (result.success) sent += 1;
  }
  return { sent };
}

/** Post-activation : signal RH sur abandon. */
export async function notifyRhFormationAbandon(
  db: SupabaseClient,
  params: {
    dossierId: string;
    participantId: string;
    kind: string;
  },
): Promise<{ sent: number }> {
  if (params.kind !== "abandon") return { sent: 0 };

  const { data: dossier } = await db
    .from("formation_dossiers")
    .select("id, organization_id, course_title, training_course_id")
    .eq("id", params.dossierId)
    .maybeSingle();
  if (!dossier?.organization_id) return { sent: 0 };

  const orgId = String(dossier.organization_id);
  let formationTitle = String(dossier.course_title ?? "").trim();
  if (!formationTitle && dossier.training_course_id) {
    const { data: course } = await db
      .from("training_courses")
      .select("title")
      .eq("id", dossier.training_course_id)
      .maybeSingle();
    formationTitle = String(course?.title ?? "").trim();
  }
  if (!formationTitle) formationTitle = "Formation";

  const { data: participant } = await db
    .from("formation_participants")
    .select("id, profile_id")
    .eq("id", params.participantId)
    .maybeSingle();

  let learnerName = "Collaborateur";
  if (participant?.profile_id) {
    const { data: profile } = await db
      .from("profiles")
      .select("email, first_name, last_name, full_name")
      .eq("id", participant.profile_id)
      .maybeSingle();
    learnerName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      String(profile?.full_name ?? "").trim() ||
      String(profile?.email ?? "Collaborateur");
  }

  const { data: org } = await db.from("organizations").select("name").eq("id", orgId).maybeSingle();
  const companyName = String(org?.name ?? "Votre entreprise");
  const base = publicAppUrl().replace(/\/$/, "");
  const dossierHref = `${base}/dashboard/entreprise`;

  const rhs = await loadRhEmails(db, orgId);
  let sent = 0;
  for (const rh of rhs) {
    const mail = getRhAbandonEmail({
      firstName: rh.firstName,
      companyName,
      learnerName,
      formationTitle,
      dossierHref,
    });
    const result = await sendOrgTrackedEmail({
      orgId,
      kind: ACTIVATION_KINDS.formationAbandon,
      label: "Signal abandon formation",
      to: rh.email,
      subject: mail.subject,
      html: mail.html,
      from: EDGE_COCKPIT_FROM,
      db,
      meta: {
        dossier_id: params.dossierId,
        participant_id: params.participantId,
      },
    });
    if (result.success) sent += 1;
  }
  return { sent };
}

/** Post-activation : signal RH quand un badge est obtenu (collab déjà notifié ailleurs). */
export async function notifyRhBadgeSignal(
  db: SupabaseClient,
  params: { recipientProfileId: string; badgeName: string },
): Promise<{ sent: number }> {
  const resolved = await resolveOrgForUser(db, params.recipientProfileId);
  if (!resolved) return { sent: 0 };

  const learnerName =
    resolved.firstName ||
    String(
      (
        await db
          .from("profiles")
          .select("full_name, email")
          .eq("id", params.recipientProfileId)
          .maybeSingle()
      ).data?.full_name ?? resolved.email,
    );

  const rhs = await loadRhEmails(db, resolved.orgId);
  const teamHref = `${publicAppUrl().replace(/\/$/, "")}/dashboard/entreprise/salaries`;
  let sent = 0;
  for (const rh of rhs) {
    const mail = getRhBadgeSignalEmail({
      firstName: rh.firstName,
      companyName: resolved.companyName,
      learnerName,
      badgeName: params.badgeName,
      teamHref,
    });
    const result = await sendOrgTrackedEmail({
      orgId: resolved.orgId,
      kind: ACTIVATION_KINDS.badgeRh,
      label: "Signal badge obtenu",
      to: rh.email,
      subject: mail.subject,
      html: mail.html,
      from: EDGE_COCKPIT_FROM,
      db,
      meta: {
        recipient_profile_id: params.recipientProfileId,
        badge_name: params.badgeName,
      },
    });
    if (result.success) sent += 1;
  }
  return { sent };
}
