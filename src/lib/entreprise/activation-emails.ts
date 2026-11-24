import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendOrgTrackedEmail } from "@/lib/email/org-outbound";
import {
  getCollabAccesEmail,
  getCollabLastReminderEmail,
  getCollabTestsEmail,
  getRhEcartsEmail,
  getRhMetiersEmail,
  getRhOuverturesEmail,
  getRhTestsEmail,
} from "@/lib/emails/templates/entreprise-activation";
import {
  buildCollaboratorInviteMetadata,
  buildCollaboratorSetPasswordUrl,
  COLLABORATOR_DASHBOARD_PATH,
} from "@/lib/entreprise/collaborator-invite";
import { buildSkillsGapPayload } from "@/lib/entreprise/skills-gap-load";
import { publicAppUrl } from "@/lib/env";
import { fetchAuthAccessStatusForUserIds } from "@/lib/queries/learner-tracking";

/** Kinds journalisés dans org_outbound_emails */
export const ACTIVATION_KINDS = {
  metiers: "activation-metiers",
  rhOuvertures: "activation-rh-ouvertures",
  rhTests: "activation-rh-tests",
  collabAcces: "activation-collab-acces",
  collabTests: "activation-collab-tests",
  collabLast: "activation-collab-last",
  ecarts: "activation-ecarts",
  formationAssignee: "formation-assignee",
  formationAbandon: "formation-abandon",
  badgeRh: "badge-rh-signal",
} as const;

const RH_ACTIVATION_KINDS = [
  ACTIVATION_KINDS.metiers,
  ACTIVATION_KINDS.rhOuvertures,
  ACTIVATION_KINDS.rhTests,
] as const;

const RH_MEMBER_ROLES = new Set(["admin", "owner", "admin_hr", "rh", "entreprise", "manager"]);
const TESTS_TOTAL = 3;
const RH_COOLDOWN_DAYS = 7;
const ORG_LOOKBACK_DAYS = 60;

export type ActivationRunStats = {
  orgsScanned: number;
  sent: number;
  skipped: number;
  errors: number;
  byKind: Record<string, number>;
};

type RhContact = {
  userId: string;
  email: string;
  firstName: string | null;
};

type CollabRow = {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileId: string | null;
  createdAt: string;
  passwordSet: boolean | null;
  lastSignInAt: string | null;
  testsDone: number;
};

function daysBetween(iso: string, nowMs: number): number {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return -1;
  return Math.floor((nowMs - t) / 86_400_000);
}

function displayName(first: string, last: string): string {
  return [first, last].map((s) => s.trim()).filter(Boolean).join(" ") || "Sans nom";
}

async function loadRhContacts(db: SupabaseClient, orgId: string): Promise<RhContact[]> {
  const { data: memberships } = await db
    .from("org_memberships")
    .select("user_id, role")
    .eq("org_id", orgId);

  const adminIds = (memberships ?? [])
    .filter((m) => RH_MEMBER_ROLES.has(String(m.role ?? "").toLowerCase()))
    .map((m) => String(m.user_id));

  if (!adminIds.length) return [];

  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, first_name, full_name")
    .in("id", adminIds);

  const out: RhContact[] = [];
  for (const p of profiles ?? []) {
    const email = String(p.email ?? "")
      .trim()
      .toLowerCase();
    if (!email.includes("@")) continue;
    out.push({
      userId: String(p.id),
      email,
      firstName: String(p.first_name ?? "").trim() || String(p.full_name ?? "").trim().split(/\s+/)[0] || null,
    });
  }
  return out;
}

async function hasOutbound(
  db: SupabaseClient,
  params: {
    orgId: string;
    kind: string;
    toEmail?: string;
    employeeId?: string;
    sinceIso?: string;
  },
): Promise<boolean> {
  let q = db
    .from("org_outbound_emails")
    .select("id, meta, to_email")
    .eq("org_id", params.orgId)
    .eq("kind", params.kind)
    .limit(40);

  if (params.sinceIso) q = q.gte("sent_at", params.sinceIso);
  if (params.toEmail) q = q.eq("to_email", params.toEmail.trim().toLowerCase());

  const { data } = await q;
  const rows = data ?? [];
  if (!params.employeeId) return rows.length > 0;
  return rows.some((row) => {
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    return String(meta.employee_id ?? "") === params.employeeId;
  });
}

async function rhCooldownActive(db: SupabaseClient, orgId: string, nowMs: number): Promise<boolean> {
  const since = new Date(nowMs - RH_COOLDOWN_DAYS * 86_400_000).toISOString();
  const { data } = await db
    .from("org_outbound_emails")
    .select("id, kind")
    .eq("org_id", orgId)
    .in("kind", [...RH_ACTIVATION_KINDS])
    .gte("sent_at", since)
    .limit(1);
  return (data ?? []).length > 0;
}

async function countTestsForProfiles(
  db: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!profileIds.length) return map;

  const [disc, idmc, softLearner, softEmployee] = await Promise.all([
    db.from("disc_resultats").select("profile_id").in("profile_id", profileIds),
    db.from("idmc_resultats").select("profile_id").in("profile_id", profileIds),
    db.from("soft_skills_resultats").select("learner_id").in("learner_id", profileIds),
    db.from("soft_skills_resultats_salarie").select("learner_id").in("learner_id", profileIds),
  ]);

  const discIds = new Set((disc.data ?? []).map((r) => String((r as { profile_id?: string }).profile_id ?? "")));
  const idmcIds = new Set((idmc.data ?? []).map((r) => String((r as { profile_id?: string }).profile_id ?? "")));
  const softIds = new Set([
    ...(softLearner.data ?? []).map((r) => String((r as { learner_id?: string }).learner_id ?? "")),
    ...(softEmployee.data ?? []).map((r) => String((r as { learner_id?: string }).learner_id ?? "")),
  ]);

  for (const id of profileIds) {
    let n = 0;
    if (discIds.has(id)) n += 1;
    if (idmcIds.has(id)) n += 1;
    if (softIds.has(id)) n += 1;
    map.set(id, n);
  }
  return map;
}

async function loadCollaborators(db: SupabaseClient, orgId: string): Promise<CollabRow[]> {
  const { data: employees } = await db
    .from("employees")
    .select("id, email, first_name, last_name, profile_id, created_at")
    .eq("company_id", orgId)
    .order("created_at", { ascending: true })
    .limit(500);

  const rows = employees ?? [];
  if (!rows.length) return [];

  const profileIds = rows
    .map((e) => String(e.profile_id ?? "").trim())
    .filter(Boolean);

  const authByUser = await fetchAuthAccessStatusForUserIds(db as never, profileIds);
  const testsByProfile = await countTestsForProfiles(db, [
    ...new Set([...profileIds, ...rows.map((e) => String(e.profile_id ?? e.id))]),
  ]);

  return rows.map((e) => {
    const profileId = e.profile_id ? String(e.profile_id) : null;
    const auth = profileId ? authByUser.get(profileId) : undefined;
    const testKey = profileId || String(e.id);
    return {
      employeeId: String(e.id),
      email: String(e.email ?? "")
        .trim()
        .toLowerCase(),
      firstName: String(e.first_name ?? "").trim(),
      lastName: String(e.last_name ?? "").trim(),
      profileId,
      createdAt: String(e.created_at ?? ""),
      passwordSet: auth?.authFound ? Boolean(auth.passwordSet) : null,
      lastSignInAt: auth?.lastSignInAt ?? null,
      testsDone: testsByProfile.get(testKey) ?? (profileId ? testsByProfile.get(profileId) ?? 0 : 0),
    };
  });
}

async function generateAccessLink(
  db: SupabaseClient,
  params: {
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    employeeId: string;
  },
): Promise<string | null> {
  const redirectTo = buildCollaboratorSetPasswordUrl(publicAppUrl());
  const metadata = buildCollaboratorInviteMetadata({
    firstName: params.firstName,
    lastName: params.lastName,
    organizationId: params.organizationId,
    employeeId: params.employeeId,
  });

  const magic = await db.auth.admin.generateLink({
    type: "magiclink",
    email: params.email,
    options: { redirectTo, data: metadata },
  });
  const link = magic.data?.properties?.action_link ?? null;
  if (link) return link;

  const recovery = await db.auth.admin.generateLink({
    type: "recovery",
    email: params.email,
    options: { redirectTo },
  });
  return recovery.data?.properties?.action_link ?? null;
}

async function sendTracked(
  db: SupabaseClient,
  params: {
    orgId: string;
    kind: string;
    label: string;
    to: string;
    subject: string;
    html: string;
    meta?: Record<string, unknown>;
  },
): Promise<boolean> {
  const result = await sendOrgTrackedEmail({
    orgId: params.orgId,
    kind: params.kind,
    label: params.label,
    to: params.to,
    subject: params.subject,
    html: params.html,
    from: EDGE_COCKPIT_FROM,
    db,
    meta: params.meta,
  });
  return result.success;
}

async function processOrg(
  db: SupabaseClient,
  org: { id: string; name: string; created_at: string },
  nowMs: number,
  stats: ActivationRunStats,
): Promise<void> {
  const orgId = org.id;
  const companyName = org.name || "Votre entreprise";
  const orgAge = daysBetween(org.created_at, nowMs);
  if (orgAge < 0) {
    stats.skipped += 1;
    return;
  }

  const base = publicAppUrl().replace(/\/$/, "");
  const metiersHref = `${base}/dashboard/entreprise/metiers`;
  const teamHref = `${base}/dashboard/entreprise/salaries`;
  const gapsHref = `${base}/dashboard/entreprise/besoins-competences`;
  const testsHref = `${base}${COLLABORATOR_DASHBOARD_PATH}`;

  const [{ count: metierCount }, rhContacts, collaborators] = await Promise.all([
    db
      .from("enterprise_job_roles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    loadRhContacts(db, orgId),
    loadCollaborators(db, orgId),
  ]);

  const metiers = metierCount ?? 0;
  const collabs = collaborators.filter((c) => c.email.includes("@"));
  const stuckAccess = collabs.filter((c) => c.passwordSet === false || !c.lastSignInAt);
  const incompleteTests = collabs.filter((c) => Boolean(c.lastSignInAt) && c.testsDone < TESTS_TOTAL);
  const complete3 = collabs.filter((c) => c.testsDone >= TESTS_TOTAL);
  const teamSize = collabs.length;

  const bump = (kind: string) => {
    stats.sent += 1;
    stats.byKind[kind] = (stats.byKind[kind] ?? 0) + 1;
  };

  const sendToRh = async (
    kind: string,
    label: string,
    build: (rh: RhContact) => { subject: string; html: string },
    meta?: Record<string, unknown>,
  ) => {
    if (!rhContacts.length) {
      stats.skipped += 1;
      return false;
    }
    if (await rhCooldownActive(db, orgId, nowMs)) {
      stats.skipped += 1;
      return false;
    }
    if (await hasOutbound(db, { orgId, kind })) {
      stats.skipped += 1;
      return false;
    }
    let any = false;
    for (const rh of rhContacts) {
      if (await hasOutbound(db, { orgId, kind, toEmail: rh.email })) continue;
      const mail = build(rh);
      const ok = await sendTracked(db, {
        orgId,
        kind,
        label,
        to: rh.email,
        subject: mail.subject,
        html: mail.html,
        meta,
      });
      if (ok) {
        any = true;
        bump(kind);
      } else {
        stats.errors += 1;
      }
    }
    return any;
  };

  // Phase 2 — J+1 métiers
  if (orgAge >= 1 && metiers === 0) {
    await sendToRh(ACTIVATION_KINDS.metiers, "Activation · créer les métiers", (rh) =>
      getRhMetiersEmail({
        firstName: rh.firstName,
        companyName,
        metiersHref,
      }),
    );
  }

  // Phase 5 — digests RH J+3 / J+7
  if (orgAge >= 3 && stuckAccess.length > 0) {
    await sendToRh(
      ACTIVATION_KINDS.rhOuvertures,
      "Activation · ouvertures en attente",
      (rh) =>
        getRhOuverturesEmail({
          firstName: rh.firstName,
          companyName,
          stuckCount: stuckAccess.length,
          sampleNames: stuckAccess.map((c) => displayName(c.firstName, c.lastName)),
          teamHref,
        }),
      { stuck_count: stuckAccess.length },
    );
  }

  if (orgAge >= 7 && incompleteTests.length > 0) {
    await sendToRh(
      ACTIVATION_KINDS.rhTests,
      "Activation · tests incomplets",
      (rh) =>
        getRhTestsEmail({
          firstName: rh.firstName,
          companyName,
          incompleteCount: incompleteTests.length,
          sampleLines: incompleteTests.map(
            (c) => `${displayName(c.firstName, c.lastName)} · ${c.testsDone}/${TESTS_TOTAL}`,
          ),
          teamHref,
        }),
      { incomplete_count: incompleteTests.length },
    );
  }

  // Phase 3 — collaborateurs
  for (const collab of collabs) {
    const age = daysBetween(collab.createdAt, nowMs);
    if (age < 0) continue;

    const needsAccess = collab.passwordSet === false || !collab.lastSignInAt;

    if (age >= 2 && needsAccess) {
      const kind = ACTIVATION_KINDS.collabAcces;
      if (
        await hasOutbound(db, {
          orgId,
          kind,
          employeeId: collab.employeeId,
        })
      ) {
        stats.skipped += 1;
      } else {
        const link = await generateAccessLink(db, {
          email: collab.email,
          firstName: collab.firstName,
          lastName: collab.lastName,
          organizationId: orgId,
          employeeId: collab.employeeId,
        });
        if (!link) {
          stats.errors += 1;
        } else {
          const mail = getCollabAccesEmail({
            firstName: collab.firstName,
            companyName,
            accessLink: link,
          });
          const ok = await sendTracked(db, {
            orgId,
            kind,
            label: "Activation · rappel accès collaborateur",
            to: collab.email,
            subject: mail.subject,
            html: mail.html,
            meta: { employee_id: collab.employeeId },
          });
          if (ok) bump(kind);
          else stats.errors += 1;
        }
      }
    }

    if (age >= 5 && collab.lastSignInAt && collab.testsDone < TESTS_TOTAL) {
      const kind = ACTIVATION_KINDS.collabTests;
      if (
        await hasOutbound(db, {
          orgId,
          kind,
          employeeId: collab.employeeId,
        })
      ) {
        stats.skipped += 1;
      } else {
        const mail = getCollabTestsEmail({
          firstName: collab.firstName,
          companyName,
          testsDone: collab.testsDone,
          testsTotal: TESTS_TOTAL,
          testsHref,
        });
        const ok = await sendTracked(db, {
          orgId,
          kind,
          label: "Activation · rappel tests collaborateur",
          to: collab.email,
          subject: mail.subject,
          html: mail.html,
          meta: { employee_id: collab.employeeId, tests_done: collab.testsDone },
        });
        if (ok) bump(kind);
        else stats.errors += 1;
      }
    }

    if (age >= 14 && needsAccess) {
      const kind = ACTIVATION_KINDS.collabLast;
      if (
        await hasOutbound(db, {
          orgId,
          kind,
          employeeId: collab.employeeId,
        })
      ) {
        stats.skipped += 1;
      } else {
        const link = await generateAccessLink(db, {
          email: collab.email,
          firstName: collab.firstName,
          lastName: collab.lastName,
          organizationId: orgId,
          employeeId: collab.employeeId,
        });
        if (!link) {
          stats.errors += 1;
        } else {
          const mail = getCollabLastReminderEmail({
            firstName: collab.firstName,
            companyName,
            accessLink: link,
          });
          const ok = await sendTracked(db, {
            orgId,
            kind,
            label: "Activation · dernier rappel collaborateur",
            to: collab.email,
            subject: mail.subject,
            html: mail.html,
            meta: { employee_id: collab.employeeId },
          });
          if (ok) bump(kind);
          else stats.errors += 1;
        }
      }
    }
  }

  // Phase 4 — mail écarts (hors cooldown RH)
  const thresholdOk =
    metiers >= 1 &&
    teamSize > 0 &&
    (complete3.length >= 3 || complete3.length / teamSize >= 0.5);

  if (thresholdOk) {
    const kind = ACTIVATION_KINDS.ecarts;
    if (await hasOutbound(db, { orgId, kind })) {
      stats.skipped += 1;
    } else if (rhContacts.length) {
      try {
        const payload = await buildSkillsGapPayload(db, {
          organizationId: orgId,
          viewer: { email: rhContacts[0]?.email ?? null },
        });
        const top = (payload.priority_needs ?? payload.needs ?? [])
          .filter((n) => n.under_target_count > 0)
          .slice(0, 3)
          .map((n) => ({
            skill: n.skill,
            metierTitle: n.metier_title,
            underTargetCount: n.under_target_count,
          }));

        if (top.length === 0) {
          stats.skipped += 1;
        } else {
          for (const rh of rhContacts) {
            const mail = getRhEcartsEmail({
              firstName: rh.firstName,
              companyName,
              gaps: top,
              gapsHref,
            });
            const ok = await sendTracked(db, {
              orgId,
              kind,
              label: "Activation · écarts prioritaires",
              to: rh.email,
              subject: mail.subject,
              html: mail.html,
              meta: {
                complete_3: complete3.length,
                team_size: teamSize,
                gaps: top,
              },
            });
            if (ok) bump(kind);
            else stats.errors += 1;
          }
        }
      } catch (err) {
        console.error("[activation-emails] gaps", orgId, err);
        stats.errors += 1;
      }
    }
  }
}

/** Cron quotidien : activation RH + collabs + mail écarts. */
export async function runEntrepriseActivationEmails(
  db: SupabaseClient,
  options?: { orgId?: string; now?: Date },
): Promise<ActivationRunStats> {
  const now = options?.now ?? new Date();
  const nowMs = now.getTime();
  const stats: ActivationRunStats = {
    orgsScanned: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    byKind: {},
  };

  const lookbackIso = new Date(nowMs - ORG_LOOKBACK_DAYS * 86_400_000).toISOString();

  let query = db
    .from("organizations")
    .select("id, name, created_at")
    .gte("created_at", lookbackIso)
    .order("created_at", { ascending: false })
    .limit(200);

  if (options?.orgId) {
    query = db.from("organizations").select("id, name, created_at").eq("id", options.orgId).limit(1);
  }

  const { data: orgs, error } = await query;
  if (error) {
    console.error("[activation-emails] orgs", error.message);
    stats.errors += 1;
    return stats;
  }

  for (const org of orgs ?? []) {
    stats.orgsScanned += 1;
    try {
      await processOrg(
        db,
        {
          id: String(org.id),
          name: String(org.name ?? ""),
          created_at: String(org.created_at ?? ""),
        },
        nowMs,
        stats,
      );
    } catch (err) {
      console.error("[activation-emails] org", org.id, err);
      stats.errors += 1;
    }
  }

  return stats;
}
