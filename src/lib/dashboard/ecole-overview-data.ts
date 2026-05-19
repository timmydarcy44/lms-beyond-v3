import type { SupabaseClient } from "@supabase/supabase-js";

export type SchoolOverviewProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_type: string | null;
  phone?: string | null;
  class_name?: string | null;
  class?: string | null;
  promo?: string | null;
  soft_skills_scores?: Record<string, number> | null;
  contract_status?: string | null;
  status?: string | null;
  employment_status?: string | null;
  alternance_status?: string | null;
};

export type SchoolOverviewOfferRow = {
  id: string;
  title?: string | null;
  created_at?: string | null;
  status?: string | null;
  city?: string | null;
  salary?: string | null;
  contract_type?: string | null;
  description?: string | null;
};

export function normalizeSchoolProfileRow(raw: Record<string, unknown>): SchoolOverviewProfileRow {
  const id = String(raw.id ?? "");
  let first = raw.first_name != null ? String(raw.first_name).trim() : null;
  let last = raw.last_name != null ? String(raw.last_name).trim() : null;
  const full = raw.full_name != null ? String(raw.full_name).trim() : "";
  if ((!first || first.length === 0) && full) {
    const parts = full.split(/\s+/).filter(Boolean);
    first = parts[0] ?? null;
    last = parts.length > 1 ? parts.slice(1).join(" ") : null;
  }
  return {
    id,
    first_name: first,
    last_name: last,
    email: raw.email != null ? String(raw.email) : null,
    role_type: raw.role_type != null ? String(raw.role_type) : null,
    phone: raw.phone != null ? String(raw.phone) : null,
    class_name: raw.class_name != null ? String(raw.class_name) : null,
    class: raw.class != null ? String(raw.class) : null,
    promo: raw.promo != null ? String(raw.promo) : null,
    soft_skills_scores:
      raw.soft_skills_scores && typeof raw.soft_skills_scores === "object"
        ? (raw.soft_skills_scores as Record<string, number>)
        : null,
    contract_status: raw.contract_status != null ? String(raw.contract_status) : null,
    status: raw.status != null ? String(raw.status) : null,
    employment_status: raw.employment_status != null ? String(raw.employment_status) : null,
    alternance_status: raw.alternance_status != null ? String(raw.alternance_status) : null,
  };
}

const LEARNER_ROLE_TYPES = new Set(
  ["apprenant", "student", "learner", "stagiaire", "alternant"].map((s) => s.toLowerCase()),
);

function isLikelySchoolLearnerProfile(p: SchoolOverviewProfileRow): boolean {
  const rt = (p.role_type ?? "").toLowerCase();
  if (!rt) return true;
  if (rt.includes("entreprise") || rt.includes("employer") || rt.includes("company")) return false;
  if (rt.includes("ecole") && rt.includes("admin")) return false;
  if (rt.includes("instructor") || rt.includes("formateur") || rt.includes("tuteur")) return false;
  return LEARNER_ROLE_TYPES.has(rt) || rt.includes("apprenant") || rt.includes("student");
}

function dedupeById(rows: SchoolOverviewProfileRow[]): SchoolOverviewProfileRow[] {
  const m = new Map<string, SchoolOverviewProfileRow>();
  for (const r of rows) {
    if (r.id) m.set(r.id, r);
  }
  return Array.from(m.values());
}

const SIGNED_APP_STATUSES = [
  "accepted",
  "signed",
  "hired",
  "alternance",
  "active",
  "signé",
  "signee",
  "contrat",
  "en poste",
];
const PENDING_APP_STATUSES = [
  "pending",
  "review",
  "interview",
  "submitted",
  "nouveau",
  "en cours",
  "shortlist",
];

type RecentApplicationRow = {
  id: string;
  job_id?: string | null;
  talent_id?: string | null;
  created_at?: string | null;
  status?: string | null;
};

const EMPTY_RECENT_APPLICATIONS: RecentApplicationRow[] = [];

export async function loadSchoolOverviewData(
  schoolId: string,
  listClient: SupabaseClient,
): Promise<{
  apprenants: SchoolOverviewProfileRow[];
  entreprises: SchoolOverviewProfileRow[];
  latestOffers: SchoolOverviewOfferRow[];
  latestConnected: SchoolOverviewProfileRow[];
  recentActivities: RecentApplicationRow[];
  offersCount: number;
  effectifTotal: number;
  alternancesSignees: number;
  apprenantsEnRecherche: number;
}> {
  const [{ data: pivotRows, error: pivotErr }, { data: companies }, { data: offers }, offersCountRes] = await Promise.all([
    listClient
      .from("school_students")
      .select("student:profiles!school_students_student_id_fkey(*)")
      .eq("school_id", schoolId),
    listClient.from("profiles").select("*").eq("school_id", schoolId).eq("role_type", "entreprise"),
    listClient
      .from("job_offers")
      .select("id, title, city, salary, description, school_id, status, contract_type, created_at, updated_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(8),
    listClient.from("job_offers").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
  ]);

  if (pivotErr) {
    console.error("[ecole-overview] school_students:", pivotErr.message);
  }

  const fromPivot = (pivotRows || [])
    .map((row: { student?: unknown }) => row.student)
    .filter(Boolean) as Record<string, unknown>[];

  const pivotIds = new Set(fromPivot.map((r) => String(r.id ?? "")));

  const { data: schoolProfiles } = await listClient.from("profiles").select("*").eq("school_id", schoolId);

  const fromProfiles = (schoolProfiles || [])
    .map((r) => normalizeSchoolProfileRow(r as Record<string, unknown>))
    .filter((p) => isLikelySchoolLearnerProfile(p) && !pivotIds.has(p.id));

  const apprenants = dedupeById([
    ...fromPivot.map((r) => normalizeSchoolProfileRow(r)),
    ...fromProfiles,
  ]);

  const talentIds = apprenants.map((r) => r.id).filter(Boolean);

  const [{ data: latestConnected }, recentApplicationsRes, jobsRes] = await Promise.all([
    listClient
      .from("profiles")
      .select("id, first_name, last_name, full_name, updated_at, role_type")
      .eq("school_id", schoolId)
      .order("updated_at", { ascending: false })
      .limit(8),
    talentIds.length
      ? listClient
          .from("applications")
          .select("id, job_id, talent_id, created_at, status")
          .in("talent_id", talentIds)
          .order("created_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: EMPTY_RECENT_APPLICATIONS, error: null }),
    listClient.from("job_offers").select("id").eq("school_id", schoolId),
  ]);

  const jobIds = ((jobsRes.data as { id: string }[] | null) ?? []).map((j) => j.id).filter(Boolean);

  let alternancesSignees = 0;
  let apprenantsEnRecherche = 0;

  if (jobIds.length > 0) {
    const [{ count: cSigned }, { count: cPending }] = await Promise.all([
      listClient
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("job_id", jobIds)
        .in("status", SIGNED_APP_STATUSES),
      listClient
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("job_id", jobIds)
        .in("status", PENDING_APP_STATUSES),
    ]);
    alternancesSignees = typeof cSigned === "number" ? cSigned : 0;
    apprenantsEnRecherche = typeof cPending === "number" ? cPending : 0;
  }

  const contractLabel = (profile: SchoolOverviewProfileRow) =>
    String(
      profile.contract_status ?? profile.status ?? profile.employment_status ?? profile.alternance_status ?? "",
    ).trim();

  const isSigned = (profile: SchoolOverviewProfileRow) => {
    const status = contractLabel(profile).toLowerCase();
    return status.length > 0 && ["signe", "signé", "active", "en poste", "contrat"].some((t) => status.includes(t));
  };

  const isSearching = (profile: SchoolOverviewProfileRow) => {
    const status = contractLabel(profile).toLowerCase();
    return status.length > 0 && ["recherche", "search", "open", "disponible"].some((t) => status.includes(t));
  };

  const profileSigned = apprenants.filter(isSigned).length;
  const profileSearch = apprenants.filter(isSearching).length;
  if (alternancesSignees === 0 && profileSigned > 0) alternancesSignees = profileSigned;
  if (apprenantsEnRecherche === 0 && profileSearch > 0) apprenantsEnRecherche = profileSearch;

  const recentApplications = (recentApplicationsRes.data ?? []) as RecentApplicationRow[];

  const connected = (latestConnected || []).map((r) => normalizeSchoolProfileRow(r as Record<string, unknown>));

  return {
    apprenants,
    entreprises: (companies || []).map((r) => normalizeSchoolProfileRow(r as Record<string, unknown>)),
    latestOffers: (offers || []) as SchoolOverviewOfferRow[],
    latestConnected: connected,
    recentActivities: recentApplications,
    offersCount: typeof offersCountRes.count === "number" ? offersCountRes.count : 0,
    effectifTotal: apprenants.length,
    alternancesSignees,
    apprenantsEnRecherche,
  };
}
