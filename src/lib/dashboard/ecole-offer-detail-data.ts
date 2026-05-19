import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeSchoolProfileRow, type SchoolOverviewProfileRow } from "@/lib/dashboard/ecole-overview-data";

export type SchoolOfferDetailRow = {
  id: string;
  school_id: string | null;
  title: string;
  city: string | null;
  salary: string | null;
  salary_range: string | null;
  contract_type: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  company_hidden_from_learner?: boolean | null;
  target_soft_skills?: string[] | null;
};

export type ApplicationWithTalent = {
  id: string;
  status: string | null;
  created_at: string | null;
  talent: SchoolOverviewProfileRow;
};

/**
 * Charge une offre de l'école + candidatures (profils) + vivier (apprenants pas encore candidats).
 */
export async function loadSchoolOfferDetail(
  schoolId: string,
  offerId: string,
  listClient: SupabaseClient,
): Promise<{
  offer: SchoolOfferDetailRow;
  applications: ApplicationWithTalent[];
  suggestedLearners: SchoolOverviewProfileRow[];
} | null> {
  const { data: rawOffer, error: offerErr } = await listClient
    .from("job_offers")
    .select("*")
    .eq("id", offerId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (offerErr || !rawOffer) {
    if (offerErr) console.error("[ecole-offer-detail] job_offers:", offerErr.message);
    return null;
  }

  const offer = rawOffer as SchoolOfferDetailRow;

  const { data: appRows } = await listClient
    .from("applications")
    .select("id, status, created_at, talent_id")
    .eq("job_id", offerId)
    .order("created_at", { ascending: false });

  const applicantIds = [...new Set((appRows || []).map((r) => String(r.talent_id ?? "")).filter(Boolean))];

  let applicantProfiles: Record<string, SchoolOverviewProfileRow> = {};
  if (applicantIds.length) {
    const { data: profs } = await listClient.from("profiles").select("*").in("id", applicantIds);
    for (const p of profs || []) {
      const row = normalizeSchoolProfileRow(p as Record<string, unknown>);
      applicantProfiles[row.id] = row;
    }
  }

  const applications: ApplicationWithTalent[] = (appRows || []).map((r) => ({
    id: String(r.id),
    status: r.status != null ? String(r.status) : null,
    created_at: r.created_at != null ? String(r.created_at) : null,
    talent: applicantProfiles[String(r.talent_id)] ?? {
      id: String(r.talent_id),
      first_name: null,
      last_name: null,
      email: null,
      role_type: null,
    },
  }));

  const { data: pivotRows } = await listClient
    .from("school_students")
    .select("student:profiles!school_students_student_id_fkey(*)")
    .eq("school_id", schoolId);

  const fromPivot = (pivotRows || [])
    .map((row: { student?: unknown }) => row.student)
    .filter(Boolean) as Record<string, unknown>[];

  const pivotIds = new Set(fromPivot.map((r) => String(r.id ?? "")));
  const { data: schoolProfiles } = await listClient.from("profiles").select("*").eq("school_id", schoolId);

  const LEARNER_HINTS = ["apprenant", "student", "learner", "stagiaire", "alternant"];
  const isLearnerish = (p: SchoolOverviewProfileRow) => {
    const rt = (p.role_type ?? "").toLowerCase();
    if (!rt) return true;
    if (rt.includes("entreprise")) return false;
    if (rt.includes("ecole") && rt.includes("admin")) return false;
    return LEARNER_HINTS.some((h) => rt.includes(h)) || rt.includes("apprenant");
  };

  const fromProfiles = (schoolProfiles || [])
    .map((r) => normalizeSchoolProfileRow(r as Record<string, unknown>))
    .filter((p) => isLearnerish(p) && !pivotIds.has(p.id));

  const allLearners = [
    ...fromPivot.map((r) => normalizeSchoolProfileRow(r)),
    ...fromProfiles,
  ];
  const byId = new Map<string, SchoolOverviewProfileRow>();
  for (const l of allLearners) {
    if (l.id) byId.set(l.id, l);
  }
  const vivier = Array.from(byId.values());
  const applicantSet = new Set(applicantIds);
  const suggestedLearners = vivier.filter((p) => !applicantSet.has(p.id));

  return { offer, applications, suggestedLearners };
}
