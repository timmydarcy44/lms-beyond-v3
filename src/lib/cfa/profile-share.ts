import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CFA_SPECIALIZATIONS, CFA_STATUS_LABELS, getCfaSpecializationLabel, type CfaApplicationStatus } from "@/lib/cfa-applications";
import { CFA_ASSESSMENT_RECIPIENT } from "@/lib/cfa/assessment-shares";
import { loadEmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

export const PROPOSABLE_STATUSES = ["dossier", "interview", "review", "administrative", "admitted"] as const;

const SKILL_BY_ID = new Map(SOFT_SKILLS.map((skill) => [String(skill.id), skill.titre]));

export function skillTitle(id: string) {
  return SKILL_BY_ID.get(id) ?? "";
}

export function isCursusId(value: string) {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

type ApplicationRow = {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  status: string;
  alternance_status: string | null;
  profile_id: string | null;
  share_with_companies: boolean | null;
  motivation_text: string | null;
  cv_path: string | null;
};

export async function resolveOfferCursus(db: SupabaseClient, diploma: string) {
  const alias = diploma.trim().toLowerCase();
  if (!alias) return null;
  const row = await db.from("cursus_aliases").select("cursus_id").eq("alias", alias).maybeSingle();
  if (row.error) return null;
  const cursusId = String((row.data as { cursus_id?: string } | null)?.cursus_id ?? "");
  return isCursusId(cursusId) ? cursusId : null;
}

async function sharedSoftUserIds(db: SupabaseClient, profileIds: string[]) {
  if (!profileIds.length) return new Set<string>();
  const shares = await db
    .from("assessment_shares")
    .select("user_id")
    .in("user_id", profileIds)
    .eq("assessment_type", "soft")
    .eq("recipient_type", "cfa")
    .eq("recipient_id", CFA_ASSESSMENT_RECIPIENT)
    .eq("shared", true)
    .is("revoked_at", null);
  return new Set(((shares.data ?? []) as { user_id: string }[]).map((row) => row.user_id));
}

export async function loadProposals(
  db: SupabaseClient,
  input: { cursusId: string; softSkillIds: string[] },
) {
  const applications = await db
    .from("cfa_applications")
    .select("id, first_name, last_name, specialization, status, alternance_status, profile_id, share_with_companies")
    .eq("specialization", input.cursusId)
    .in("status", [...PROPOSABLE_STATUSES]);
  const rows = (applications.data ?? []) as ApplicationRow[];
  const ids = rows.map((row) => row.id);
  const placed = ids.length
    ? await db.from("apprentice_placements").select("apprentice_id").eq("status", "active").in("apprentice_id", ids)
    : { data: [] };
  const active = new Set(((placed.data ?? []) as { apprentice_id: string }[]).map((row) => row.apprentice_id));
  const free = rows.filter((row) => !active.has(row.id));
  const shared = await sharedSoftUserIds(db, free.map((row) => row.profile_id).filter((id): id is string => Boolean(id)));
  const strengths = new Map<string, string[]>();
  await Promise.all(
    free.map(async (row) => {
      if (!row.profile_id || !shared.has(row.profile_id)) return;
      const results = await loadEmployeeTestResults(db, row.profile_id);
      strengths.set(
        row.id,
        results.soft_skills.filter((item) => item.score >= 70).map((item) => item.skill.toLowerCase()),
      );
    }),
  );
  const wanted = input.softSkillIds.map(skillTitle).filter(Boolean).map((title) => title.toLowerCase());
  const candidates = free.map((row) => {
    const known = strengths.has(row.id);
    const matched = known ? wanted.filter((title) => strengths.get(row.id)?.includes(title)).length : 0;
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      cursus: getCfaSpecializationLabel(row.specialization),
      status: CFA_STATUS_LABELS[row.status as CfaApplicationStatus] ?? row.status,
      availability: row.alternance_status === "company_found" ? "Entreprise trouvée" : row.alternance_status === "searching" ? "En recherche" : "Disponibilité non précisée",
      shareWithCompanies: Boolean(row.share_with_companies),
      evaluated: known,
      matched,
      wanted: wanted.length,
    };
  });
  candidates.sort((a, b) => b.matched - a.matched || a.lastName.localeCompare(b.lastName, "fr"));
  return candidates;
}

export async function loadPublicProfile(db: SupabaseClient, token: string) {
  const send = await db
    .from("cfa_profile_sends")
    .select("id, application_id, company_id, sent_at, opened_at, response, expires_at")
    .eq("token", token)
    .maybeSingle();
  const row = send.data as {
    id: string;
    application_id: string;
    opened_at: string | null;
    response: string | null;
    expires_at: string;
  } | null;
  if (!row) return null;
  const expired = new Date(row.expires_at).getTime() < Date.now();
  if (!row.opened_at && !expired) {
    await db.from("cfa_profile_sends").update({ opened_at: new Date().toISOString() }).eq("id", row.id);
  }
  const application = await db
    .from("cfa_applications")
    .select("first_name, last_name, specialization, alternance_status, motivation_text, cv_path, profile_id")
    .eq("id", row.application_id)
    .maybeSingle();
  const person = application.data as ApplicationRow | null;
  if (!person) return null;
  let cvUrl: string | null = null;
  if (person.cv_path) {
    if (String(person.cv_path).startsWith("http")) cvUrl = String(person.cv_path);
    else {
      const signed = await db.storage.from("cfa-applications").createSignedUrl(String(person.cv_path), 60 * 60 * 24 * 7);
      cvUrl = signed.data?.signedUrl ?? null;
    }
  }
  const shares = person.profile_id
    ? await db
        .from("assessment_shares")
        .select("assessment_type")
        .eq("user_id", person.profile_id)
        .eq("recipient_type", "cfa")
        .eq("recipient_id", CFA_ASSESSMENT_RECIPIENT)
        .eq("shared", true)
        .is("revoked_at", null)
    : { data: [] };
  const sharedTypes = new Set(((shares.data ?? []) as { assessment_type: string }[]).map((item) => item.assessment_type));
  let strengths: string[] = [];
  let idmc: number | null = null;
  let disc: string | null = null;
  if (person.profile_id && (sharedTypes.has("soft") || sharedTypes.has("idmc") || sharedTypes.has("disc"))) {
    const results = await loadEmployeeTestResults(db, person.profile_id);
    if (sharedTypes.has("soft")) strengths = results.soft_skills.filter((item) => item.score >= 70).map((item) => item.skill);
    if (sharedTypes.has("idmc")) idmc = results.idmc_score;
    if (sharedTypes.has("disc") && results.disc) {
      const scores = results.disc;
      disc = (Object.entries(scores) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0]?.toUpperCase() ?? null;
    }
  }
  return {
    firstName: person.first_name,
    lastName: person.last_name,
    cursus: getCfaSpecializationLabel(person.specialization),
    availability: person.alternance_status === "company_found" ? "A déjà une entreprise" : person.alternance_status === "searching" ? "Recherche une entreprise" : "Non précisée",
    motivation: String(person.motivation_text ?? "").trim().slice(0, 500),
    cvUrl,
    strengths,
    idmc,
    disc,
    response: row.response,
    expired,
  };
}

export function newProfileToken() {
  return randomBytes(24).toString("hex");
}
