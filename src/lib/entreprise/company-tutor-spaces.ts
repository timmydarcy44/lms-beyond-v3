import type { SupabaseClient } from "@supabase/supabase-js";

export type CompanyTutorSpace = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  alternants: { id: string; firstName: string; lastName: string; status: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  brochure: "Fiche cursus",
  profile: "Candidature",
  challenge: "Challenge",
  dossier: "Dossier",
  interview: "Entretien",
  review: "Revue",
  administrative: "Administratif",
  admitted: "Admis",
  contract: "En contrat",
  rejected: "Non retenu",
};

export function tutorStatusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

/** Tuteurs et alternants d'une organisation, ou liste vide s'il n'y a aucun placement en cours. */
export async function loadCompanyTutorSpaces(
  db: SupabaseClient,
  organizationId: string,
): Promise<{ hasApprentices: boolean; tutors: CompanyTutorSpace[] }> {
  const org = await db.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  const orgName = String((org.data as { name?: string | null } | null)?.name ?? "").trim();

  const byOrg = await db
    .from("cfa_companies")
    .select("id")
    .eq("organization_id", organizationId);
  let companyIds = ((byOrg.data ?? []) as { id: string }[]).map((row) => row.id);
  if (!companyIds.length && orgName) {
    const byName = await db.from("cfa_companies").select("id").ilike("company_name", orgName);
    companyIds = ((byName.data ?? []) as { id: string }[]).map((row) => row.id);
  }
  if (!companyIds.length) return { hasApprentices: false, tutors: [] };

  const placements = await db
    .from("apprentice_placements")
    .select("tutor_id, apprentice_id, status")
    .in("company_id", companyIds)
    .in("status", ["pending", "active"]);
  const rows = (placements.data ?? []) as { tutor_id: string | null; apprentice_id: string; status: string }[];
  if (!rows.length) return { hasApprentices: false, tutors: [] };

  const tutorIds = [...new Set(rows.map((row) => row.tutor_id).filter(Boolean))] as string[];
  const applicationIds = [...new Set(rows.map((row) => row.apprentice_id))];
  const [tutors, applications] = await Promise.all([
    tutorIds.length
      ? db.from("company_tutors").select("id, first_name, last_name, email, job_title").in("id", tutorIds)
      : Promise.resolve({ data: [] }),
    db.from("cfa_applications").select("id, first_name, last_name, status").in("id", applicationIds),
  ]);

  const apps = new Map(
    ((applications.data ?? []) as { id: string; first_name?: string | null; last_name?: string | null; status?: string | null }[])
      .map((row) => [row.id, row]),
  );

  const spaces = ((tutors.data ?? []) as { id: string; first_name: string; last_name: string; email: string; job_title?: string | null }[])
    .map((tutor) => ({
      id: tutor.id,
      firstName: tutor.first_name,
      lastName: tutor.last_name,
      email: tutor.email,
      jobTitle: tutor.job_title ?? "",
      alternants: rows
        .filter((row) => row.tutor_id === tutor.id)
        .map((row) => {
          const app = apps.get(row.apprentice_id);
          return {
            id: row.apprentice_id,
            firstName: String(app?.first_name ?? "").trim(),
            lastName: String(app?.last_name ?? "").trim(),
            status: tutorStatusLabel(String(app?.status ?? row.status)),
          };
        }),
    }))
    .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"));

  return { hasApprentices: true, tutors: spaces };
}
