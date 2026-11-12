import { fetchLastSignInForUserIds } from "@/lib/queries/learner-tracking";
import { listUserRoles, hasTutorRole } from "@/lib/auth/user-roles";
import {
  getDossierStage,
  type DossierStage,
} from "@/lib/formation-dossier/stages";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type AccountMemberFormation = {
  dossierId: string;
  participantId: string;
  title: string;
  stage: DossierStage | null;
  status: string;
  nextDate: string | null;
  dateLabel: string | null;
};

export type AccountMemberPerson = {
  userId: string;
  employeeId: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  jobTitle: string | null;
  isTutor: boolean;
  invited: boolean;
  invitedAt: string | null;
  formations: AccountMemberFormation[];
  badges: number;
  lastSeenAt: string | null;
};

export type UnlinkedParticipant = {
  key: string;
  email: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  profileIds: string[];
  participantIds: string[];
  dossierIds: string[];
  formations: AccountMemberFormation[];
};

export type AccountParticipantsPayload = {
  organizationId: string;
  organizationName: string;
  members: AccountMemberPerson[];
  unlinked: UnlinkedParticipant[];
};

const PARTICLES = new Set(["de", "du", "des", "le", "la", "les", "d", "l", "von", "van", "da", "di"]);

export function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** Title-case FR : THOUIN → Thouin, jean-pierre → Jean-Pierre, particules en minuscules. */
export function formatPersonName(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "";
  return text
    .split(" ")
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && PARTICLES.has(lower.replace(/\.$/, ""))) return lower;
      return lower
        .split("-")
        .map((chunk) => {
          if (!chunk) return chunk;
          if (PARTICLES.has(chunk)) return chunk;
          return chunk.charAt(0).toUpperCase() + chunk.slice(1);
        })
        .join("-");
    })
    .join(" ");
}

export function splitPersonName(fullName: string): { firstName: string; lastName: string } {
  const parts = formatPersonName(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function shortDateLabel(iso: string | null, stage: DossierStage | null) {
  if (!iso) return null;
  const date = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return null;
  const label = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  if (stage === "session") return `Session ${label}`;
  return label;
}

function displayNameFromProfile(profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  reference_email?: string | null;
}) {
  const composed = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  const raw = String(profile.full_name ?? "").trim() || composed;
  return formatPersonName(raw) || String(profile.email || profile.reference_email || "Sans nom");
}

/**
 * Membres du compte + formations Qualiopi (formation_participants),
 * et participants de dossiers non rattachés à un siège membre.
 */
export async function getAccountParticipants(
  accountId: string,
): Promise<AccountParticipantsPayload | null> {
  const db = getServiceRoleClient();
  if (!db) return null;

  const { data: org } = await db
    .from("organizations")
    .select("id, name")
    .eq("id", accountId)
    .maybeSingle();
  if (!org) return null;

  const [membershipsRes, employeesRes, dossiersRes] = await Promise.all([
    db.from("org_memberships").select("user_id, role, created_at").eq("org_id", accountId),
    db
      .from("employees")
      .select("id, first_name, last_name, email, job_title, status, created_at, profile_id")
      .eq("company_id", accountId),
    db
      .from("formation_dossiers")
      .select("id, status, session_id, course_title, training_course_id")
      .eq("organization_id", accountId)
      .limit(300),
  ]);

  const memberships = (membershipsRes.data ?? []) as Array<{
    user_id: string;
    role: string;
    created_at: string;
  }>;
  const employees = (employeesRes.error ? [] : employeesRes.data ?? []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    job_title: string | null;
    status: string | null;
    created_at: string | null;
    profile_id?: string | null;
  }>;
  const dossiers = (dossiersRes.error ? [] : dossiersRes.data ?? []) as Array<{
    id: string;
    status: string | null;
    session_id: string | null;
    course_title: string | null;
    training_course_id: string | null;
  }>;

  const memberUserIds = memberships.map((m) => m.user_id);
  const dossierIds = dossiers.map((d) => d.id);

  const [profilesRes, rolesByUser, participantsRes, assertionsRes, lastSeenMap] = await Promise.all([
    memberUserIds.length
      ? db
          .from("profiles")
          .select("id, full_name, first_name, last_name, email, reference_email, role, role_type")
          .in("id", memberUserIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    listUserRoles(db, memberUserIds),
    dossierIds.length
      ? db
          .from("formation_participants")
          .select("id, dossier_id, profile_id, job_title, created_at")
          .in("dossier_id", dossierIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
    memberUserIds.length
      ? db
          .from("badge_assertions")
          .select("id, recipient_profile_id, revoked_at")
          .in("recipient_profile_id", memberUserIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
    fetchLastSignInForUserIds(db, memberUserIds),
  ]);

  const profileMap = new Map(
    ((profilesRes.data ?? []) as Array<{
      id: string;
      full_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      reference_email?: string | null;
      role?: string | null;
      role_type?: string | null;
    }>).map((p) => [p.id, p]),
  );

  const participantRows = (participantsRes.error ? [] : participantsRes.data ?? []) as Array<{
    id: string;
    dossier_id: string;
    profile_id: string;
    job_title: string | null;
    created_at: string | null;
  }>;

  const participantProfileIds = [...new Set(participantRows.map((p) => p.profile_id).filter(Boolean))];
  const missingProfileIds = participantProfileIds.filter((id) => !profileMap.has(id));
  if (missingProfileIds.length) {
    const extra = await db
      .from("profiles")
      .select("id, full_name, first_name, last_name, email, reference_email, role, role_type")
      .in("id", missingProfileIds);
    for (const p of (extra.data ?? []) as Array<{
      id: string;
      full_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      reference_email?: string | null;
      role?: string | null;
      role_type?: string | null;
    }>) {
      profileMap.set(p.id, p);
    }
  }

  const sessionIds = [...new Set(dossiers.map((d) => d.session_id).filter(Boolean))] as string[];
  const nextSlotBySession = new Map<string, string>();
  if (sessionIds.length) {
    const today = new Date().toISOString().slice(0, 10);
    const slots = await db
      .from("formation_slots")
      .select("session_id, slot_date")
      .in("session_id", sessionIds)
      .gte("slot_date", today)
      .order("slot_date", { ascending: true })
      .limit(500);
    for (const slot of (slots.error ? [] : slots.data ?? []) as Array<{
      session_id: string;
      slot_date: string;
    }>) {
      if (!nextSlotBySession.has(slot.session_id)) {
        nextSlotBySession.set(slot.session_id, slot.slot_date);
      }
    }
  }

  const dossierById = new Map(
    dossiers.map((d) => {
      const stage = getDossierStage(d.status);
      const nextDate = d.session_id ? nextSlotBySession.get(d.session_id) ?? null : null;
      return [
        d.id,
        {
          ...d,
          stage,
          nextDate,
          title: (d.course_title || "Formation").trim() || "Formation",
          dateLabel: shortDateLabel(nextDate, stage),
        },
      ] as const;
    }),
  );

  const memberIds = new Set(memberUserIds);
  const emailToMemberId = new Map<string, string>();
  for (const m of memberships) {
    const profile = profileMap.get(m.user_id);
    const email = normalizeEmail(profile?.email || profile?.reference_email);
    if (email) emailToMemberId.set(email, m.user_id);
  }

  const employeeByEmail = new Map<string, (typeof employees)[number]>();
  for (const emp of employees) {
    const email = normalizeEmail(emp.email);
    if (email) employeeByEmail.set(email, emp);
  }

  const formationsByMember = new Map<string, AccountMemberFormation[]>();
  const linkedParticipantIds = new Set<string>();

  for (const row of participantRows) {
    const dossier = dossierById.get(row.dossier_id);
    if (!dossier) continue;
    const profile = profileMap.get(row.profile_id);
    const email = normalizeEmail(profile?.email || profile?.reference_email);
    let linkedUserId: string | null = null;
    if (memberIds.has(row.profile_id)) {
      linkedUserId = row.profile_id;
    } else if (email && emailToMemberId.has(email)) {
      linkedUserId = emailToMemberId.get(email)!;
    }

    const formation: AccountMemberFormation = {
      dossierId: row.dossier_id,
      participantId: row.id,
      title: dossier.title,
      stage: dossier.stage,
      status: String(dossier.status ?? ""),
      nextDate: dossier.nextDate,
      dateLabel: dossier.dateLabel,
    };

    if (linkedUserId) {
      linkedParticipantIds.add(row.id);
      const list = formationsByMember.get(linkedUserId) ?? [];
      if (!list.some((f) => f.dossierId === formation.dossierId)) list.push(formation);
      formationsByMember.set(linkedUserId, list);
    }
  }

  const assertionRows = (assertionsRes.error ? [] : assertionsRes.data ?? []) as Array<{
    recipient_profile_id: string;
    revoked_at: string | null;
  }>;
  const badgesByUser = new Map<string, number>();
  for (const row of assertionRows) {
    if (row.revoked_at) continue;
    badgesByUser.set(
      row.recipient_profile_id,
      (badgesByUser.get(row.recipient_profile_id) ?? 0) + 1,
    );
  }

  const members: AccountMemberPerson[] = memberships.map((member) => {
    const profile = profileMap.get(member.user_id);
    const email = String(profile?.email || profile?.reference_email || "");
    const emp = employeeByEmail.get(normalizeEmail(email));
    const isTutor = hasTutorRole(
      rolesByUser.get(member.user_id),
      member.role,
      profile?.role || profile?.role_type,
    );
    const displayRole = member.role === "tutor" ? "learner" : member.role;
    const name = profile
      ? displayNameFromProfile(profile)
      : formatPersonName([emp?.first_name, emp?.last_name].filter(Boolean).join(" ")) || "Sans nom";
    const firstName =
      formatPersonName(profile?.first_name) ||
      formatPersonName(emp?.first_name) ||
      splitPersonName(name).firstName ||
      null;
    const lastName =
      formatPersonName(profile?.last_name) ||
      formatPersonName(emp?.last_name) ||
      splitPersonName(name).lastName ||
      null;
    const formations = (formationsByMember.get(member.user_id) ?? []).sort((a, b) =>
      (a.nextDate || "9999").localeCompare(b.nextDate || "9999"),
    );
    return {
      userId: member.user_id,
      employeeId: emp?.id ? String(emp.id) : null,
      name,
      firstName,
      lastName,
      email,
      role: displayRole,
      jobTitle: emp?.job_title || null,
      isTutor,
      invited: false,
      invitedAt: null,
      formations,
      badges: badgesByUser.get(member.user_id) ?? 0,
      lastSeenAt: lastSeenMap.get(member.user_id) ?? null,
    };
  });

  const knownEmails = new Set(members.map((m) => normalizeEmail(m.email)).filter(Boolean));
  for (const emp of employees) {
    const email = normalizeEmail(emp.email);
    if (!email || knownEmails.has(email)) continue;
    if (emp.status === "inactive") continue;
    const name =
      formatPersonName([emp.first_name, emp.last_name].filter(Boolean).join(" ")) || "Invitation";
    members.push({
      userId: `employee:${emp.id}`,
      employeeId: String(emp.id),
      name,
      firstName: formatPersonName(emp.first_name) || null,
      lastName: formatPersonName(emp.last_name) || null,
      email: String(emp.email ?? ""),
      role: "invited",
      jobTitle: emp.job_title,
      isTutor: false,
      invited: true,
      invitedAt: emp.created_at ? String(emp.created_at) : null,
      formations: [],
      badges: 0,
      lastSeenAt: null,
    });
  }

  const unlinkedMap = new Map<string, UnlinkedParticipant>();
  for (const row of participantRows) {
    if (linkedParticipantIds.has(row.id)) continue;
    const dossier = dossierById.get(row.dossier_id);
    if (!dossier) continue;
    const profile = profileMap.get(row.profile_id);
    const emailRaw = profile?.email || profile?.reference_email || null;
    const email = emailRaw ? normalizeEmail(emailRaw) : null;
    const name = profile
      ? displayNameFromProfile(profile)
      : "Participant";
    const key = email || `name:${name.toLowerCase()}:${row.profile_id}`;
    const formation: AccountMemberFormation = {
      dossierId: row.dossier_id,
      participantId: row.id,
      title: dossier.title,
      stage: dossier.stage,
      status: String(dossier.status ?? ""),
      nextDate: dossier.nextDate,
      dateLabel: dossier.dateLabel,
    };
    const existing = unlinkedMap.get(key);
    if (existing) {
      if (!existing.profileIds.includes(row.profile_id)) existing.profileIds.push(row.profile_id);
      existing.participantIds.push(row.id);
      if (!existing.dossierIds.includes(row.dossier_id)) existing.dossierIds.push(row.dossier_id);
      if (!existing.formations.some((f) => f.dossierId === formation.dossierId)) {
        existing.formations.push(formation);
      }
    } else {
      unlinkedMap.set(key, {
        key,
        email: emailRaw ? String(emailRaw).trim() : null,
        name,
        firstName: formatPersonName(profile?.first_name) || splitPersonName(name).firstName || null,
        lastName: formatPersonName(profile?.last_name) || splitPersonName(name).lastName || null,
        profileIds: [row.profile_id],
        participantIds: [row.id],
        dossierIds: [row.dossier_id],
        formations: [formation],
      });
    }
  }

  members.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const unlinked = [...unlinkedMap.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return {
    organizationId: String(org.id),
    organizationName: String(org.name ?? "ce compte"),
    members,
    unlinked,
  };
}
