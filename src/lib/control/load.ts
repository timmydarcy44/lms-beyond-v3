import { getServiceRoleClient } from "@/lib/supabase/server";
import { classifyOrganization, normalizeOrgName, pickSignal, summarizeRevenue, type BillingDoc, type OrgKind, type OrgStatus } from "./policy";

type OrgRow = {
  id: string;
  name: string | null;
  slug: string | null;
  created_at: string | null;
  updated_at: string | null;
  logo_url: string | null;
  onboarding_step: string | null;
  estimated_users: number | null;
  status?: string | null;
  kind?: string | null;
  account_manager_id?: string | null;
  trial_ends_at?: string | null;
  client_since?: string | null;
  siret?: string | null;
};

const FULL_COLUMNS =
  "id,name,slug,created_at,updated_at,logo_url,onboarding_step,estimated_users,status,kind,account_manager_id,trial_ends_at,client_since,siret";
const BASE_COLUMNS =
  "id,name,slug,created_at,updated_at,logo_url,onboarding_step,estimated_users,siret";

function asKind(value: string | null | undefined, slug: string | null): OrgKind {
  if (value === "client" || value === "internal" || value === "demo") return value;
  return classifyOrganization(slug).kind;
}

function asStatus(value: string | null | undefined, slug: string | null): OrgStatus {
  if (value === "active" || value === "trial" || value === "onboarding" || value === "demo" || value === "archived") return value;
  return classifyOrganization(slug).status;
}

export type ControlAccount = {
  id: string;
  name: string;
  slug: string;
  kind: OrgKind;
  status: OrgStatus;
  onboardingStep: string | null;
  lastActivityAt: string | null;
  logoUrl: string | null;
  modules: string[];
  activeUsers: number;
  totalUsers: number;
  revenue12HtCents: number;
  revenuePrev12HtCents: number;
  openQuoteHtCents: number;
  outstandingHtCents: number;
  overdueHtCents: number;
  signal: { key: string; label: string; rank: number } | null;
  accountManagerId: string | null;
  accountManagerName: string | null;
  clientSince: string | null;
  trialEndsAt: string | null;
  createdAt: string | null;
};

export type ControlCockpit = {
  accounts: ControlAccount[];
  schemaReady: boolean;
  duplicates: Array<{ name: string; ids: string[] }>;
};

async function selectOrgs(db: NonNullable<ReturnType<typeof getServiceRoleClient>>) {
  const full = await db.from("organizations").select(FULL_COLUMNS).order("name");
  if (!full.error) return { rows: (full.data ?? []) as OrgRow[], schemaReady: true };
  if (full.error.code === "42703" || full.error.message.includes("status") || full.error.message.includes("kind")) {
    const base = await db.from("organizations").select(BASE_COLUMNS).order("name");
    if (base.error) throw new Error(base.error.message);
    return { rows: (base.data ?? []) as OrgRow[], schemaReady: false };
  }
  throw new Error(full.error.message);
}

export async function loadControlCockpit(now = new Date()): Promise<ControlCockpit> {
  const db = getServiceRoleClient();
  if (!db) return { accounts: [], schemaReady: false, duplicates: [] };
  const { rows, schemaReady } = await selectOrgs(db);
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return { accounts: [], schemaReady, duplicates: [] };
  const since = new Date(now);
  since.setUTCMonth(since.getUTCMonth() - 24);
  const managerIds = rows.map((row) => row.account_manager_id).filter((id): id is string => Boolean(id));

  const [memberships, employees, features, billing, managers] = await Promise.all([
    db.from("org_memberships").select("org_id, role, created_at").in("org_id", ids),
    db.from("employees").select("company_id, status").in("company_id", ids),
    db.from("organization_features").select("org_id, feature_key, is_enabled").in("org_id", ids),
    db.from("org_billing_documents").select("org_id, doc_type, status, issued_at, due_at, paid_at, amount_ht_cents, sale_type, opco_ht_cents").gte("issued_at", since.toISOString()),
    managerIds.length
      ? db.from("profiles").select("id, full_name, display_name").in("id", managerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const docs: BillingDoc[] = ((billing.error ? [] : billing.data) ?? []).map((row) => ({
    orgId: String(row.org_id),
    docType: row.doc_type,
    status: row.status,
    issuedAt: row.issued_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    amountHtCents: Number(row.amount_ht_cents ?? 0),
    saleType: row.sale_type,
    opcoHtCents: Number(row.opco_ht_cents ?? 0),
  }));

  const managerName = new Map(
    ((managers.error ? [] : managers.data) ?? []).map((profile) => [
      profile.id as string,
      (profile.full_name as string) || (profile.display_name as string) || "Chargé de compte",
    ]),
  );

  const to = now.toISOString();
  const from12 = new Date(now);
  from12.setUTCMonth(from12.getUTCMonth() - 12);
  const orgsForRevenue = rows.map((row) => ({
    id: row.id,
    kind: asKind(row.kind, row.slug),
    status: asStatus(row.status, row.slug),
  }));

  const accounts = rows.map((row) => {
    const kind = asKind(row.kind, row.slug);
    const status = asStatus(row.status, row.slug);
    const memberRows = ((memberships.data ?? []) as Array<{ org_id: string; created_at?: string }>).filter((item) => item.org_id === row.id);
    const employeeRows = ((employees.error ? [] : employees.data) ?? []).filter((item) => item.company_id === row.id) as Array<{ status?: string | null }>;
    const totalUsers = employeeRows.length || memberRows.length;
    const activeUsers = employeeRows.length
      ? employeeRows.filter((item) => (item.status ?? "active") === "active").length
      : memberRows.length;
    const pendingInvites = employeeRows.filter((item) => item.status === "invited" || item.status === "pending").length;
    const revenue = summarizeRevenue(docs, orgsForRevenue, from12.toISOString(), to, row.id, to);
    const lastMembership = memberRows.reduce<string | null>((latest, item) => {
      if (!item.created_at) return latest;
      if (!latest || item.created_at > latest) return item.created_at;
      return latest;
    }, null);
    const lastActivityAt = [row.updated_at, lastMembership].filter(Boolean).sort().at(-1) ?? null;
    const modules = ((features.error ? [] : features.data) ?? [])
      .filter((item) => item.org_id === row.id && item.is_enabled)
      .map((item) => String(item.feature_key));
    const signal = pickSignal({
      overdueCents: kind === "demo" || status === "demo" ? 0 : revenue.overdueHtCents,
      pendingInvites,
      opcoToFile: false,
      onboardingIncomplete: status === "onboarding",
      trialEndsAt: row.trial_ends_at,
      nowIso: to,
    });
    return {
      id: row.id,
      name: row.name?.trim() || "Sans nom",
      slug: row.slug ?? "",
      kind,
      status,
      onboardingStep: row.onboarding_step,
      lastActivityAt,
      logoUrl: row.logo_url,
      modules,
      activeUsers,
      totalUsers,
      revenue12HtCents: revenue.periodHtCents,
      revenuePrev12HtCents: revenue.previousPeriodHtCents,
      openQuoteHtCents: revenue.quotesHtCents,
      outstandingHtCents: revenue.outstandingHtCents,
      overdueHtCents: revenue.overdueHtCents,
      signal,
      accountManagerId: row.account_manager_id ?? null,
      accountManagerName: row.account_manager_id ? managerName.get(row.account_manager_id) ?? null : null,
      clientSince: row.client_since ?? (classifyOrganization(row.slug).clientSinceFromCreated ? row.created_at : null),
      trialEndsAt: row.trial_ends_at ?? null,
      createdAt: row.created_at,
    } satisfies ControlAccount;
  });

  const grouped = new Map<string, string[]>();
  for (const account of accounts) {
    const key = normalizeOrgName(account.name);
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), account.id]);
  }
  const duplicates = [...grouped.entries()]
    .filter(([, orgIds]) => orgIds.length > 1)
    .map(([name, orgIds]) => ({ name, ids: orgIds }));

  return { accounts, schemaReady, duplicates };
}

export async function loadAccountDetail(orgId: string) {
  const cockpit = await loadControlCockpit();
  const account = cockpit.accounts.find((item) => item.id === orgId) ?? null;
  const db = getServiceRoleClient();
  if (!account || !db) {
    return {
      account,
      schemaReady: cockpit.schemaReady,
      members: [],
      people: [],
      employees: [],
      activity: [],
      note: null,
      documents: [],
      courses: [],
      catalogue: [],
      badges: [],
      assertions: [],
    };
  }

  const [memberships, employees, activity, notes, documents, orgCourses, catalog] = await Promise.all([
    db.from("org_memberships").select("user_id, role, created_at").eq("org_id", orgId),
    db.from("employees").select("id, first_name, last_name, email, job_title, status, created_at").eq("company_id", orgId),
    db.from("org_activity").select("id, actor_type, action, payload, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(20),
    db.from("org_notes").select("id, body, updated_at").eq("org_id", orgId).order("updated_at", { ascending: false }).limit(1),
    db.from("org_billing_documents").select("id, doc_type, number, status, issued_at, due_at, paid_at, amount_ht_cents, sale_type, opco_ht_cents").eq("org_id", orgId).order("issued_at", { ascending: false }),
    db.from("courses").select("id, title, status, cover_image, delivery_format").eq("org_id", orgId).limit(40),
    db.from("courses").select("id, title, status, cover_image, delivery_format").in("status", ["published", "active"]).limit(40),
  ]);

  const userIds = ((memberships.data ?? []) as Array<{ user_id: string }>).map((item) => item.user_id);
  const profiles = userIds.length
    ? await db.from("profiles").select("id, full_name, email, role, role_type").in("id", userIds)
    : { data: [] };
  const profileMap = new Map(((profiles.data ?? []) as Array<{ id: string }>).map((profile) => [profile.id, profile]));
  const enrollments = userIds.length
    ? await db.from("enrollments").select("user_id, course_id").in("user_id", userIds)
    : { data: [] as Array<{ user_id: string; course_id: string }> };
  const enrollmentRows = (enrollments.error ? [] : enrollments.data ?? []) as Array<{ user_id: string; course_id: string }>;
  const assertions = userIds.length
    ? await db.from("badge_assertions").select("id, recipient_profile_id, recipient_name, badge_class_id, issued_at, is_public, revoked_at").in("recipient_profile_id", userIds)
    : { data: [] as Array<Record<string, unknown>> };
  const assertionRows = (assertions.error ? [] : assertions.data ?? []) as Array<{
    id: string;
    recipient_profile_id: string;
    recipient_name: string | null;
    badge_class_id: string;
    issued_at: string;
    is_public: boolean;
    revoked_at: string | null;
  }>;
  const badgeIds = [...new Set(assertionRows.map((row) => row.badge_class_id).filter(Boolean))];
  const orgBadgeQuery = await db.from("open_badges").select("id, title, name, status, criteria_items, image_url").eq("org_id", orgId).limit(40);
  const assertionBadges = badgeIds.length
    ? await db.from("open_badges").select("id, title, name").in("id", badgeIds)
    : { data: [] as Array<{ id: string; title?: string | null; name?: string | null }> };
  const badgeTitle = new Map(
    ((assertionBadges.data ?? []) as Array<{ id: string; title?: string | null; name?: string | null }>).map((badge) => [
      badge.id,
      badge.title || badge.name || "Open Badge",
    ]),
  );

  const members = ((memberships.data ?? []) as Array<{ user_id: string; role: string; created_at: string }>).map((member) => {
    const profile = profileMap.get(member.user_id) as { full_name?: string; email?: string; role?: string; role_type?: string } | undefined;
    const mine = enrollmentRows.filter((row) => row.user_id === member.user_id);
    const delivered = assertionRows.filter((row) => row.recipient_profile_id === member.user_id && !row.revoked_at);
    return {
      userId: member.user_id,
      employeeId: null as string | null,
      role: member.role,
      name: profile?.full_name || "Sans nom",
      email: profile?.email || "",
      profileRole: profile?.role_type || profile?.role || member.role,
      createdAt: member.created_at,
      invited: false,
      formationsTotal: mine.length,
      formationsDone: 0,
      badges: delivered.length,
      lastSeenAt: null as string | null,
    };
  });

  const knownEmails = new Set(members.map((member) => member.email.toLowerCase()).filter(Boolean));
  const invited = ((employees.error ? [] : employees.data) ?? [])
    .filter((employee) => !knownEmails.has(String(employee.email ?? "").toLowerCase()))
    .map((employee) => ({
      userId: `employee:${employee.id}`,
      employeeId: String(employee.id),
      role: employee.status === "inactive" ? "inactive" : "invited",
      name: [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Invitation",
      email: String(employee.email ?? ""),
      profileRole: "invited",
      createdAt: String(employee.created_at ?? ""),
      invited: employee.status !== "inactive",
      formationsTotal: 0,
      formationsDone: 0,
      badges: 0,
      lastSeenAt: null as string | null,
    }));

  const courseById = new Map<string, FormationRow>();
  for (const course of (orgCourses.error ? [] : orgCourses.data ?? []) as FormationRow[]) courseById.set(course.id, course);
  const missingIds = [...new Set(enrollmentRows.map((row) => row.course_id))].filter((id) => !courseById.has(id));
  if (missingIds.length) {
    const extra = await db.from("courses").select("id, title, status, cover_image, delivery_format").in("id", missingIds);
    for (const course of (extra.data ?? []) as FormationRow[]) courseById.set(course.id, course);
  }
  const enrolledByCourse = new Map<string, number>();
  for (const row of enrollmentRows) enrolledByCourse.set(row.course_id, (enrolledByCourse.get(row.course_id) ?? 0) + 1);
  const formations = [...courseById.values()].map((course) => ({
    id: course.id,
    title: course.title || "Formation",
    status: course.status || "draft",
    cover: course.cover_image || null,
    format: course.delivery_format || null,
    duration: null,
    enrolled: enrolledByCourse.get(course.id) ?? 0,
    badges: 0,
    owned: ((orgCourses.data ?? []) as FormationRow[]).some((item) => item.id === course.id),
  }));
  const assignedIds = new Set(formations.map((course) => course.id));
  const catalogue = ((catalog.error ? [] : catalog.data) ?? [])
    .filter((course) => !assignedIds.has(course.id))
    .map((course) => ({
      id: course.id as string,
      title: (course.title as string) || "Formation",
      status: (course.status as string) || "published",
      cover: (course.cover_image as string | null) || null,
      format: (course.delivery_format as string | null) || null,
      duration: null,
    }));

  const badgeCards = ((orgBadgeQuery.error ? [] : orgBadgeQuery.data) ?? []).map((badge) => {
    const criteria = Array.isArray(badge.criteria_items) ? badge.criteria_items.length : 0;
    const related = assertionRows.filter((row) => row.badge_class_id === badge.id);
    return {
      id: String(badge.id),
      title: String(badge.title || badge.name || "Open Badge"),
      status: String(badge.status || "draft"),
      competencies: criteria,
      imageUrl: (badge.image_url as string | null) ?? null,
      delivered: related.filter((row) => !row.revoked_at).length,
      inProgress: 0,
      toFix: 0,
      revoked: related.filter((row) => row.revoked_at).length,
    };
  });

  return {
    account,
    schemaReady: cockpit.schemaReady,
    members,
    people: [...members, ...invited],
    employees: employees.error ? [] : employees.data ?? [],
    activity: activity.error ? [] : activity.data ?? [],
    note: notes.error ? null : (notes.data?.[0] ?? null),
    documents: documents.error ? [] : documents.data ?? [],
    courses: formations,
    catalogue,
    badges: badgeCards,
    assertions: assertionRows
      .filter((row) => !row.revoked_at)
      .map((row) => ({
        id: row.id,
        holder: row.recipient_name || members.find((member) => member.userId === row.recipient_profile_id)?.name || "Titulaire",
        badge: badgeTitle.get(row.badge_class_id) || "Open Badge",
        issuedAt: row.issued_at,
        isPublic: Boolean(row.is_public),
      })),
  };
}

type FormationRow = {
  id: string;
  title: string | null;
  status: string | null;
  cover_image: string | null;
  delivery_format: string | null;
};
