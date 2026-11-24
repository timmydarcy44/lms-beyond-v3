/**
 * Données fiche Client BtoC (Particulier) — Byound Control.
 * Réutilise catalog_access, enrollments, formation_dossiers / coffre quand disponibles.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCoffreSnapshot, type CoffreSnapshot } from "@/lib/formation-documents/coffre";
import { looksLikeTestAccount } from "@/lib/control/test-account";

export type BtocFundingType = "fonds_propres" | "cpf" | "autre";

export type BtocFormationCard = {
  id: string;
  title: string;
  origin: "achat" | "assignee";
  status: "non_commencee" | "en_cours" | "terminee";
  purchasedAt: string | null;
  priceTtc: number | null;
  paymentMethod: string | null;
  invoiceUrl: string | null;
  accessEndsAt: string | null;
  progressPct: number;
  courseId: string | null;
  dossierId: string | null;
  coverUrl: string | null;
};

export type BtocClientFile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  fundingType: BtocFundingType | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  isTest: boolean;
  /** Visible uniquement référente handicap / super — jamais la nature. */
  adaptationNeedDeclared: boolean | null;
  canViewAdaptation: boolean;
  formations: BtocFormationCard[];
  coffres: Array<CoffreSnapshot & { formationTitle: string }>;
  progressAvgPct: number;
};

const BTOC_ROLES = new Set(["btoc", "particulier", "PARTICULIER"]);
const BTOC_LEARNER_ROLES = new Set([
  "learner",
  "student",
  "apprenant",
  "btoc",
  "particulier",
  "PARTICULIER",
]);

/**
 * Client BtoC = apprenant / particulier uniquement.
 * Ignore tuteur, club, praticien… même si `role_type` est (à tort) `particulier`.
 */
export function isBtocRole(role: string | null | undefined, roleType?: string | null) {
  const r = String(role ?? "").trim();
  const rt = String(roleType ?? "").trim().toLowerCase();
  if (!BTOC_LEARNER_ROLES.has(r)) return false;
  if (BTOC_ROLES.has(r)) return true;
  return rt === "particulier" || rt === "btoc";
}

function splitName(fullName: string | null, email: string) {
  const raw = String(fullName ?? "").trim();
  if (!raw) {
    const local = email.split("@")[0] ?? "Client";
    return { firstName: local, lastName: null as string | null, fullName: local };
  }
  const parts = raw.split(/\s+/);
  return {
    firstName: parts[0] ?? raw,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
    fullName: raw,
  };
}

function fundingOf(raw: unknown): BtocFundingType | null {
  const v = String(raw ?? "").trim();
  if (v === "fonds_propres" || v === "cpf" || v === "autre") return v;
  return null;
}

async function fetchLastSignIn(service: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await service.auth.admin.getUserById(userId);
    if (error) return null;
    return data.user?.last_sign_in_at ?? null;
  } catch {
    return null;
  }
}

type CatalogAccessRow = {
  id: string;
  catalog_item_id: string;
  granted_at: string | null;
  access_status: string | null;
  purchase_amount: number | null;
  catalog_items: {
    id: string;
    title: string | null;
    price: number | null;
    content_id: string | null;
    cover_url?: string | null;
  } | null;
};

/**
 * Charge la fiche B2C. `canViewAdaptation` doit être calculé côté caller (RP / super).
 */
export async function loadBtocClientFile(
  service: SupabaseClient,
  userId: string,
  options?: { canViewAdaptation?: boolean },
): Promise<BtocClientFile | null> {
  const canViewAdaptation = options?.canViewAdaptation === true;

  let profileRes = await service
    .from("profiles")
    .select(
      "id, email, full_name, first_name, last_name, role, phone, created_at, address_line, postal_code, city, funding_type, is_test, rqth",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileRes.error && /address_line|postal_code|funding_type|is_test|rqth|column|schema cache/i.test(profileRes.error.message)) {
    profileRes = await service
      .from("profiles")
      .select("id, email, full_name, first_name, last_name, role, phone, created_at")
      .eq("id", userId)
      .maybeSingle();
  }

  const profile = profileRes.data as Record<string, unknown> | null;
  if (!profile) return null;

  const email = String(profile.email ?? "");
  const names = splitName(
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
      String(profile.full_name ?? ""),
    email,
  );

  const lastSignInAt = await fetchLastSignIn(service, userId);

  const formations: BtocFormationCard[] = [];

  const { data: accessRaw } = await service
    .from("catalog_access")
    .select(
      `
      id,
      catalog_item_id,
      granted_at,
      access_status,
      purchase_amount,
      catalog_items ( id, title, price, content_id )
    `,
    )
    .eq("user_id", userId)
    .in("access_status", ["purchased", "manually_granted"])
    .order("granted_at", { ascending: false });

  for (const row of (accessRaw ?? []) as unknown as CatalogAccessRow[]) {
    const item = row.catalog_items;
    const origin = row.access_status === "manually_granted" ? "assignee" : "achat";
    formations.push({
      id: row.id,
      title: item?.title?.trim() || "Formation",
      origin,
      status: "en_cours",
      purchasedAt: row.granted_at,
      priceTtc: row.purchase_amount ?? item?.price ?? null,
      paymentMethod: origin === "achat" ? "Carte bancaire" : null,
      invoiceUrl: null,
      accessEndsAt: null,
      progressPct: 0,
      courseId: item?.content_id ?? null,
      dossierId: null,
      coverUrl: item?.cover_url ?? null,
    });
  }

  const { data: enrollments } = await service
    .from("enrollments")
    .select("id, course_id, created_at, courses ( id, title )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);

  const knownCourseIds = new Set(formations.map((f) => f.courseId).filter(Boolean));
  for (const enr of enrollments ?? []) {
    const courseId = String((enr as { course_id?: string }).course_id ?? "");
    if (!courseId || knownCourseIds.has(courseId)) continue;
    const course = (enr as { courses?: { title?: string } | null }).courses;
    formations.push({
      id: `enrollment-${(enr as { id: string }).id}`,
      title: course?.title?.trim() || "Formation",
      origin: "assignee",
      status: "en_cours",
      purchasedAt: (enr as { created_at?: string | null }).created_at ?? null,
      priceTtc: null,
      paymentMethod: null,
      invoiceUrl: null,
      accessEndsAt: null,
      progressPct: 0,
      courseId,
      dossierId: null,
      coverUrl: null,
    });
  }

  // Progression LMS approximative via lesson_progress si dispo
  for (const formation of formations) {
    if (!formation.courseId) continue;
    const { data: lessons } = await service
      .from("lessons")
      .select("id")
      .eq("course_id", formation.courseId)
      .limit(200);
    const lessonIds = (lessons ?? []).map((l) => String((l as { id: string }).id));
    if (!lessonIds.length) continue;
    const { count: done } = await service
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("lesson_id", lessonIds)
      .eq("completed", true);
    const total = lessonIds.length;
    const completed = done ?? 0;
    formation.progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (formation.progressPct >= 100) formation.status = "terminee";
    else if (formation.progressPct <= 0) formation.status = "non_commencee";
    else formation.status = "en_cours";
  }

  // Dossiers / coffre liés au participant
  const coffres: Array<CoffreSnapshot & { formationTitle: string }> = [];
  const { data: participants } = await service
    .from("formation_participants")
    .select("id, dossier_id")
    .eq("profile_id", userId)
    .limit(20);

  for (const p of participants ?? []) {
    const dossierId = String((p as { dossier_id?: string }).dossier_id ?? "");
    if (!dossierId) continue;
    const snap = await buildCoffreSnapshot(service, dossierId);
    if (!snap) continue;
    coffres.push({ ...snap, formationTitle: snap.course_title || "Formation" });
    const match = formations.find((f) => !f.dossierId && f.title === snap.course_title);
    if (match) match.dossierId = dossierId;
  }

  const progressAvgPct =
    formations.length > 0
      ? Math.round(formations.reduce((s, f) => s + f.progressPct, 0) / formations.length)
      : 0;

  const adaptationNeedDeclared =
    canViewAdaptation && "rqth" in profile ? profile.rqth === true : null;

  return {
    id: String(profile.id),
    email,
    firstName: names.firstName,
    lastName: names.lastName,
    fullName: names.fullName,
    phone: profile.phone != null ? String(profile.phone) : null,
    addressLine: profile.address_line != null ? String(profile.address_line) : null,
    postalCode: profile.postal_code != null ? String(profile.postal_code) : null,
    city: profile.city != null ? String(profile.city) : null,
    fundingType: fundingOf(profile.funding_type),
    createdAt: profile.created_at != null ? String(profile.created_at) : null,
    lastSignInAt,
    isTest:
      profile.is_test === true ||
      looksLikeTestAccount({ email, name: names.fullName, role: String(profile.role ?? "") }),
    adaptationNeedDeclared,
    canViewAdaptation,
    formations,
    coffres,
    progressAvgPct,
  };
}
