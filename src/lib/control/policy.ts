export const DEMO_SLUGS = [
  "edge-business-demo",
  "edge-demo-rh-aw78",
  "edge-lab",
  "entreprise-de-test-yw9p",
  "lalaland-s3eb",
  "test03-xapi",
  "timdada",
] as const;

export const INTERNAL_SLUGS = [
  "byound-5gfu",
  "jessicacontentin",
  "playmakers",
  "byound-care-sekx",
  "byound-care-j7iu",
] as const;

export const ACTIVE_SLUG = "byound-5gfu";

export type OrgKind = "client" | "internal" | "demo";
export type OrgStatus = "active" | "trial" | "onboarding" | "demo" | "archived";

const DEMO = new Set<string>(DEMO_SLUGS);
const INTERNAL = new Set<string>(INTERNAL_SLUGS);

export function classifyOrganization(slug: string | null | undefined): {
  kind: OrgKind;
  status: OrgStatus;
  clientSinceFromCreated: boolean;
} {
  const key = (slug ?? "").trim().toLowerCase();
  if (key === ACTIVE_SLUG) {
    return { kind: "internal", status: "active", clientSinceFromCreated: true };
  }
  if (DEMO.has(key)) {
    return { kind: "demo", status: "demo", clientSinceFromCreated: false };
  }
  if (INTERNAL.has(key)) {
    return { kind: "internal", status: "onboarding", clientSinceFromCreated: false };
  }
  return { kind: "client", status: "onboarding", clientSinceFromCreated: false };
}

export type SaleType = "formation" | "plateforme" | "open_badges" | "tests";

export type BillingDoc = {
  orgId: string;
  docType: "invoice" | "quote" | "credit_note";
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled";
  issuedAt: string;
  dueAt?: string | null;
  paidAt?: string | null;
  amountHtCents: number;
  saleType?: SaleType | null;
  opcoHtCents?: number;
};

export type RevenueOrg = {
  id: string;
  kind: OrgKind;
  status: OrgStatus;
};

export type RevenueSummary = {
  periodHtCents: number;
  previousPeriodHtCents: number;
  deltaHtCents: number;
  collectedHtCents: number;
  outstandingHtCents: number;
  overdueHtCents: number;
  quotesHtCents: number;
  opcoHtCents: number;
  byMonth: Array<{ month: string; htCents: number }>;
  bySaleType: Record<SaleType, number>;
  excludedDemo: boolean;
};

const EMPTY_TYPES = (): Record<SaleType, number> => ({
  formation: 0,
  plateforme: 0,
  open_badges: 0,
  tests: 0,
});

function inRange(iso: string, from: number, to: number) {
  const time = new Date(iso).getTime();
  return time >= from && time < to;
}

function countsInRevenue(doc: BillingDoc) {
  return (
    (doc.docType === "invoice" || doc.docType === "credit_note") &&
    (doc.status === "issued" || doc.status === "paid" || doc.status === "overdue")
  );
}

function signed(doc: BillingDoc) {
  return doc.docType === "credit_note" ? -doc.amountHtCents : doc.amountHtCents;
}

export function summarizeRevenue(
  docs: BillingDoc[],
  orgs: RevenueOrg[],
  fromIso: string,
  toIso: string,
  orgId: string | null,
  nowIso: string,
): RevenueSummary {
  const empty = (): RevenueSummary => ({
    periodHtCents: 0,
    previousPeriodHtCents: 0,
    deltaHtCents: 0,
    collectedHtCents: 0,
    outstandingHtCents: 0,
    overdueHtCents: 0,
    quotesHtCents: 0,
    opcoHtCents: 0,
    byMonth: [],
    bySaleType: EMPTY_TYPES(),
    excludedDemo: false,
  });

  const orgById = new Map(orgs.map((org) => [org.id, org]));
  if (orgId) {
    const org = orgById.get(orgId);
    if (org && (org.kind === "demo" || org.status === "demo")) {
      return { ...empty(), excludedDemo: true };
    }
  }

  const included = (id: string) => {
    if (orgId && id !== orgId) return false;
    const org = orgById.get(id);
    if (!org) return false;
    return org.kind !== "demo" && org.status !== "demo";
  };

  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  const prevFrom = from - (to - from);
  const now = new Date(nowIso).getTime();
  const result = empty();

  const monthCursor = new Date(fromIso);
  monthCursor.setUTCDate(1);
  monthCursor.setUTCHours(0, 0, 0, 0);
  const monthEnd = new Date(to - 1);
  const months: string[] = [];
  while (monthCursor.getTime() <= monthEnd.getTime()) {
    const key = `${monthCursor.getUTCFullYear()}-${String(monthCursor.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push(key);
    monthCursor.setUTCMonth(monthCursor.getUTCMonth() + 1);
  }
  const monthTotals = new Map(months.map((month) => [month, 0]));

  for (const doc of docs) {
    if (!included(doc.orgId)) continue;
    if (doc.docType === "quote" && (doc.status === "issued" || doc.status === "draft") && inRange(doc.issuedAt, from, to)) {
      result.quotesHtCents += doc.amountHtCents;
      continue;
    }
    if (!countsInRevenue(doc)) continue;
    const amount = signed(doc);
    if (inRange(doc.issuedAt, from, to)) {
      result.periodHtCents += amount;
      if (doc.docType === "invoice") {
        if (doc.paidAt) result.collectedHtCents += doc.amountHtCents;
        else {
          result.outstandingHtCents += doc.amountHtCents;
          if (doc.dueAt && new Date(doc.dueAt).getTime() < now) result.overdueHtCents += doc.amountHtCents;
        }
        result.opcoHtCents += doc.opcoHtCents ?? 0;
      }
      if (doc.saleType && doc.saleType in result.bySaleType) {
        result.bySaleType[doc.saleType] += amount;
      }
      const issued = new Date(doc.issuedAt);
      const key = `${issued.getUTCFullYear()}-${String(issued.getUTCMonth() + 1).padStart(2, "0")}`;
      if (monthTotals.has(key)) monthTotals.set(key, (monthTotals.get(key) ?? 0) + amount);
    } else if (inRange(doc.issuedAt, prevFrom, from)) {
      result.previousPeriodHtCents += amount;
    }
  }

  result.deltaHtCents = result.periodHtCents - result.previousPeriodHtCents;
  result.byMonth = months.map((month) => ({ month, htCents: monthTotals.get(month) ?? 0 }));
  return result;
}

export type SignalKey =
  | "overdue_invoice"
  | "inactive_21d"
  | "pending_invites"
  | "opco_to_file"
  | "onboarding_incomplete"
  | "trial_ending";

export type AccountSignal = { key: SignalKey; label: string; rank: number };

export function pickSignal(input: {
  overdueCents: number;
  lastSignInAt?: string | null;
  pendingInvites: number;
  opcoToFile: boolean;
  onboardingIncomplete: boolean;
  trialEndsAt?: string | null;
  nowIso: string;
}): AccountSignal | null {
  const now = new Date(input.nowIso).getTime();
  if (input.overdueCents > 0) {
    return { key: "overdue_invoice", label: "Facture en retard", rank: 0 };
  }
  if (input.lastSignInAt) {
    const age = now - new Date(input.lastSignInAt).getTime();
    if (age >= 21 * 24 * 60 * 60 * 1000) {
      return { key: "inactive_21d", label: "Aucune connexion depuis 21 j", rank: 1 };
    }
  }
  if (input.pendingInvites > 0) {
    const n = input.pendingInvites;
    return {
      key: "pending_invites",
      label: n === 1 ? "1 invitation en attente" : `${n} invitations en attente`,
      rank: 2,
    };
  }
  if (input.opcoToFile) {
    return { key: "opco_to_file", label: "Dossier OPCO à déposer", rank: 3 };
  }
  if (input.onboardingIncomplete) {
    return { key: "onboarding_incomplete", label: "Démarrage incomplet", rank: 4 };
  }
  if (input.trialEndsAt) {
    const left = new Date(input.trialEndsAt).getTime() - now;
    if (left >= 0 && left <= 14 * 24 * 60 * 60 * 1000) {
      const days = Math.max(1, Math.ceil(left / (24 * 60 * 60 * 1000)));
      return { key: "trial_ending", label: `Fin d'essai dans ${days} j`, rank: 5 };
    }
  }
  return null;
}

export function canStartImpersonation(input: { isStaff: boolean; isJade: boolean }) {
  return input.isStaff && !input.isJade;
}

export function assertWriteAllowed(mode: "read" | "write"): { ok: true } | { ok: false; status: 403; error: string } {
  if (mode === "write") return { ok: true };
  return { ok: false, status: 403, error: "Lecture seule" };
}

export function isSessionActive(session: { endedAt?: string | null; expiresAt: string }, nowIso: string) {
  if (session.endedAt) return false;
  return new Date(session.expiresAt).getTime() > new Date(nowIso).getTime();
}

export function effectiveMode(
  session: { mode: "read" | "write"; writeExpiresAt?: string | null; endedAt?: string | null; expiresAt: string },
  nowIso: string,
): "read" | "write" | "expired" {
  if (!isSessionActive(session, nowIso)) return "expired";
  if (session.mode !== "write") return "read";
  if (!session.writeExpiresAt) return "read";
  if (new Date(session.writeExpiresAt).getTime() <= new Date(nowIso).getTime()) return "read";
  return "write";
}

const SENSITIVE_PREFIXES = [
  "/api/beyond-care",
  "/api/mental-health",
  "/api/care",
  "/dashboard/formateur/beyond-care",
  "/super/premium/beyond-care",
  "/api/tests",
  "/api/soft-skills",
  "/api/idmc",
  "/soft-skills",
  "/api/messages",
  "/dashboard/messages",
  "/api/stripe",
  "/api/billing/payment",
];

const SENSITIVE_FRAGMENTS = ["reset-password", "change-password", "mfa", "payment-method", "payment_method"];

export function isSensitivePath(pathname: string) {
  const path = pathname.split("?")[0] ?? pathname;
  if (SENSITIVE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return true;
  return SENSITIVE_FRAGMENTS.some((fragment) => path.includes(fragment));
}

export function buildActivityRow(input: {
  orgId: string;
  actorUserId: string;
  actorType: "client" | "byound_on_behalf" | "system";
  action: string;
  payload?: Record<string, unknown>;
  impersonationSessionId?: string | null;
  createdAt?: string;
}) {
  return {
    org_id: input.orgId,
    actor_user_id: input.actorUserId,
    actor_type: input.actorType,
    action: input.action,
    payload: input.payload ?? {},
    impersonation_session_id: input.impersonationSessionId ?? null,
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

export function formatEurosHt(cents: number) {
  const euros = Math.round(cents / 100);
  return `${new Intl.NumberFormat("fr-FR").format(euros)} €`;
}

export function formatEuroDelta(cents: number) {
  const euros = Math.round(cents / 100);
  const sign = euros > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("fr-FR").format(euros)} €`;
}

export function normalizeOrgName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
