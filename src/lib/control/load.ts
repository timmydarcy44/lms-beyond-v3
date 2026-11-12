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
  address_line?: string | null;
  address_zip?: string | null;
  address_city?: string | null;
  address_country?: string | null;
};

const FULL_COLUMNS =
  "id,name,slug,created_at,updated_at,logo_url,onboarding_step,estimated_users,status,kind,account_manager_id,trial_ends_at,client_since,siret,address_line,address_zip,address_city,address_country";
const FULL_COLUMNS_NO_ADDRESS =
  "id,name,slug,created_at,updated_at,logo_url,onboarding_step,estimated_users,status,kind,account_manager_id,trial_ends_at,client_since,siret";
const BASE_COLUMNS =
  "id,name,slug,created_at,updated_at,logo_url,onboarding_step,estimated_users,siret";

function asKind(value: string | null | undefined, slug: string | null): OrgKind {
  if (classifyOrganization(slug).kind === "demo") return "demo";
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
  siret: string | null;
  addressLine: string | null;
  addressZip: string | null;
  addressCity: string | null;
  addressCountry: string | null;
};

export type ControlCockpit = {
  accounts: ControlAccount[];
  schemaReady: boolean;
  duplicates: Array<{ name: string; ids: string[] }>;
};

async function selectOrgs(db: NonNullable<ReturnType<typeof getServiceRoleClient>>) {
  const full = await db.from("organizations").select(FULL_COLUMNS).order("name");
  if (!full.error) return { rows: (full.data ?? []) as OrgRow[], schemaReady: true };
  if (
    full.error.code === "42703" ||
    full.error.message.includes("address_") ||
    full.error.message.includes("status") ||
    full.error.message.includes("kind")
  ) {
    const mid = await db.from("organizations").select(FULL_COLUMNS_NO_ADDRESS).order("name");
    if (!mid.error) return { rows: (mid.data ?? []) as OrgRow[], schemaReady: true };
    if (mid.error.code === "42703" || mid.error.message.includes("status") || mid.error.message.includes("kind")) {
      const base = await db.from("organizations").select(BASE_COLUMNS).order("name");
      if (base.error) throw new Error(base.error.message);
      return { rows: (base.data ?? []) as OrgRow[], schemaReady: false };
    }
    throw new Error(mid.error.message);
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
      ? db.from("account_managers").select("id, first_name, last_name, email").in("id", managerIds)
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
    ((managers.error ? [] : managers.data) ?? []).map((manager) => [
      manager.id as string,
      [manager.first_name, manager.last_name].filter(Boolean).join(" ").trim() ||
        (manager.email as string) ||
        "Chargé de compte",
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
      siret: row.siret ?? null,
      addressLine: row.address_line?.trim() || null,
      addressZip: row.address_zip?.trim() || null,
      addressCity: row.address_city?.trim() || null,
      addressCountry: row.address_country?.trim() || "FR",
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
      outboundEmails: [],
      staffManagers: [],
      note: null,
      documents: [],
      courses: [],
      lmsCourses: [],
      badges: [],
      assertions: [],
    };
  }

  const [memberships, employees, activity, outboundEmails, notes, documents, orgCourses, lmsPool, staffAdmins, lmsGrants] = await Promise.all([
    db.from("org_memberships").select("user_id, role, created_at").eq("org_id", orgId),
    db.from("employees").select("id, first_name, last_name, email, job_title, status, created_at").eq("company_id", orgId),
    db.from("org_activity").select("id, actor_type, action, payload, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(40),
    db
      .from("org_outbound_emails")
      .select("id, kind, label, subject, to_email, status, sent_at, delivered_at, opened_at, resend_id, meta")
      .eq("org_id", orgId)
      .order("sent_at", { ascending: false })
      .limit(100),
    db.from("org_notes").select("id, body, updated_at").eq("org_id", orgId).order("updated_at", { ascending: false }).limit(1),
    db.from("org_billing_documents").select("id, doc_type, number, status, issued_at, due_at, paid_at, amount_ht_cents, sale_type, opco_ht_cents").eq("org_id", orgId).order("issued_at", { ascending: false }),
    db.from("courses").select("id, title, status, cover_image, delivery_format").eq("org_id", orgId).limit(40),
    // Formations LMS Byound (publisher=byound) — distinctes des offres catalogue commercial
    db
      .from("courses")
      .select("id, title, status, cover_image, delivery_format, builder_snapshot")
      .in("status", ["published", "active", "draft"])
      .order("updated_at", { ascending: false })
      .limit(400),
    db
      .from("account_managers")
      .select("id, first_name, last_name, email, phone, photo_url, is_active")
      .eq("is_active", true)
      .order("last_name", { ascending: true }),
    db.from("organization_lms_courses").select("course_id, granted_at").eq("organization_id", orgId).limit(200),
  ]);

  const userIds = ((memberships.data ?? []) as Array<{ user_id: string }>).map((item) => item.user_id);
  const profiles = userIds.length
    ? await db.from("profiles").select("id, full_name, email, role, role_type").in("id", userIds)
    : { data: [] };
  const profileMap = new Map(((profiles.data ?? []) as Array<{ id: string }>).map((profile) => [profile.id, profile]));
  const { listUserRoles, hasTutorRole } = await import("@/lib/auth/user-roles");
  const rolesByUser = await listUserRoles(db, userIds);
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
    const isTutor = hasTutorRole(
      rolesByUser.get(member.user_id),
      member.role,
      profile?.role || profile?.role_type,
    );
    // Affichage : membership tutor legacy → traité comme collaborateur + tuteur
    const displayRole = member.role === "tutor" ? "learner" : member.role;
    return {
      userId: member.user_id,
      employeeId: null as string | null,
      role: displayRole,
      isTutor,
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
      isTutor: false,
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

  type LmsPoolRow = FormationRow & {
    builder_snapshot?: { general?: { publisher?: string; title?: string; cover_image?: string; heroImage?: string } } | null;
  };
  const isByoundLms = (course: LmsPoolRow) => course.builder_snapshot?.general?.publisher === "byound";

  const courseById = new Map<string, FormationRow>();
  for (const course of (orgCourses.error ? [] : orgCourses.data ?? []) as FormationRow[]) courseById.set(course.id, course);
  const missingIds = [...new Set(enrollmentRows.map((row) => row.course_id))].filter((id) => !courseById.has(id));
  if (missingIds.length) {
    const extra = await db.from("courses").select("id, title, status, cover_image, delivery_format").in("id", missingIds);
    for (const course of (extra.data ?? []) as FormationRow[]) courseById.set(course.id, course);
  }
  const grantIds = ((lmsGrants.error ? [] : lmsGrants.data) ?? [])
    .map((row) => String((row as { course_id?: string }).course_id ?? ""))
    .filter((id) => id && !courseById.has(id));
  if (grantIds.length) {
    const granted = await db.from("courses").select("id, title, status, cover_image, delivery_format").in("id", grantIds);
    for (const course of (granted.data ?? []) as FormationRow[]) courseById.set(course.id, course);
  }
  const enrolledByCourse = new Map<string, number>();
  for (const row of enrollmentRows) enrolledByCourse.set(row.course_id, (enrolledByCourse.get(row.course_id) ?? 0) + 1);
  const ownedIds = new Set(((orgCourses.data ?? []) as FormationRow[]).map((item) => item.id));
  const grantedIdSet = new Set(
    ((lmsGrants.error ? [] : lmsGrants.data) ?? [])
      .map((row) => String((row as { course_id?: string }).course_id ?? ""))
      .filter(Boolean),
  );
  const formations = [...courseById.values()].map((course) => ({
    id: course.id,
    title: course.title || "Formation",
    status: course.status || "draft",
    cover: course.cover_image || null,
    format: course.delivery_format || null,
    duration: null,
    enrolled: enrolledByCourse.get(course.id) ?? 0,
    badges: 0,
    owned: ownedIds.has(course.id),
    lmsGranted: grantedIdSet.has(course.id),
  }));
  const assignedIds = new Set(formations.map((course) => course.id));
  const lmsPoolRows = ((lmsPool.error ? [] : lmsPool.data) ?? []) as LmsPoolRow[];
  const lmsCourses = lmsPoolRows
    .filter((course) => isByoundLms(course) && !assignedIds.has(course.id))
    .map((course) => {
      const general = course.builder_snapshot?.general;
      return {
        id: course.id,
        title: general?.title?.trim() || course.title || "Formation",
        status: course.status || "published",
        cover: general?.cover_image || general?.heroImage || course.cover_image || null,
        format: course.delivery_format || null,
        duration: null,
      };
    });

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

  const trackedEmails = (outboundEmails.error ? [] : outboundEmails.data ?? []).map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    label: String(row.label || row.kind),
    subject: String(row.subject),
    toEmail: String(row.to_email),
    status: String(row.status || "envoyé") as "envoyé" | "délivré" | "ouvert" | "rejeté",
    sentAt: String(row.sent_at),
    deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
    openedAt: row.opened_at ? String(row.opened_at) : null,
    tracked: true as const,
  }));

  // Historique dossiers déjà envoyés avant le journal outbound (sans tracking Resend).
  const dossiers = await db
    .from("formation_dossiers")
    .select("id")
    .eq("organization_id", orgId)
    .limit(80);
  const dossierIds = (dossiers.error ? [] : dossiers.data ?? []).map((row) => String(row.id));
  const legacyDocs =
    dossierIds.length > 0
      ? await db
          .from("formation_documents")
          .select("id, kind, title, sent_at, last_sent_to, opened_at")
          .in("dossier_id", dossierIds)
          .not("sent_at", "is", null)
          .order("sent_at", { ascending: false })
          .limit(80)
      : { data: [], error: null };

  const trackedKeys = new Set(
    trackedEmails.map((email) => `${email.kind}|${email.toEmail}|${email.sentAt.slice(0, 16)}`),
  );
  const legacyEmails = (legacyDocs.error ? [] : legacyDocs.data ?? [])
    .map((row) => {
      const toEmail = String(row.last_sent_to || "")
        .split(",")[0]
        ?.trim()
        .toLowerCase();
      const sentAt = String(row.sent_at);
      const kind = String(row.kind);
      const key = `${kind}|${toEmail}|${sentAt.slice(0, 16)}`;
      if (!toEmail || !toEmail.includes("@") || trackedKeys.has(key)) return null;
      return {
        id: `legacy:${row.id}`,
        kind,
        label: String(row.title || kind),
        subject: String(row.title || kind),
        toEmail,
        status: (row.opened_at ? "ouvert" : "envoyé") as "envoyé" | "délivré" | "ouvert" | "rejeté",
        sentAt,
        deliveredAt: null as string | null,
        openedAt: row.opened_at ? String(row.opened_at) : null,
        tracked: false as const,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    kind: string;
    label: string;
    subject: string;
    toEmail: string;
    status: "envoyé" | "délivré" | "ouvert" | "rejeté";
    sentAt: string;
    deliveredAt: string | null;
    openedAt: string | null;
    tracked: boolean;
  }>;

  let staffManagerRows = (staffAdmins.error ? [] : staffAdmins.data) ?? [];
  if (
    account.accountManagerId &&
    !staffManagerRows.some((row) => String(row.id) === account.accountManagerId)
  ) {
    const current = await db
      .from("account_managers")
      .select("id, first_name, last_name, email, phone, photo_url, is_active")
      .eq("id", account.accountManagerId)
      .maybeSingle();
    if (current.data) staffManagerRows = [...staffManagerRows, current.data];
  }
  const staffManagers = staffManagerRows
    .map((manager) => ({
      id: String(manager.id),
      name:
        [manager.first_name, manager.last_name].filter(Boolean).join(" ").trim() ||
        String(manager.email || "").trim() ||
        "Chargé de compte",
      email: String(manager.email || "").trim().toLowerCase(),
      phone: manager.phone ? String(manager.phone) : null,
      photoUrl: manager.photo_url ? String(manager.photo_url) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return {
    account,
    schemaReady: cockpit.schemaReady,
    members,
    people: [...members, ...invited],
    employees: employees.error ? [] : employees.data ?? [],
    activity: activity.error ? [] : activity.data ?? [],
    outboundEmails: [...trackedEmails, ...legacyEmails].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    ),
    staffManagers,
    note: notes.error ? null : (notes.data?.[0] ?? null),
    documents: documents.error ? [] : documents.data ?? [],
    courses: formations,
    lmsCourses,
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
