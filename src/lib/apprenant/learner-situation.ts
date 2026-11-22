import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Situation calculée côté serveur — jamais choisie par l'apprenant.
 * - apprentice : contrat d'alternance actif OU placement CFA ouvert (entreprise assignée)
 * - employee   : salarié formé par son entreprise (espace Business)
 * - candidate  : candidature Byound School en cours
 * - learner    : défaut
 */
export type LearnerSituation = "candidate" | "learner" | "apprentice" | "employee";

export type LearnerSituationDetails = {
  situation: LearnerSituation;
  activeContractId: string | null;
  companyId: string | null;
  tutorId: string | null;
  applicationId: string | null;
  /** true si le groupe menu « Mon alternance » doit apparaître */
  showAlternanceNav: boolean;
};

const EMPLOYEE_ROLES = new Set([
  "salarie",
  "collaborateur",
  "employee",
  "collaborator",
]);

const OPEN_CANDIDATURE_STATUSES = new Set([
  "brochure",
  "profile",
  "challenge",
  "dossier",
  "interview",
  "review",
  "administrative",
  "admitted",
]);

function normalizeRole(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function loadApplicationIds(
  db: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const byProfile = await db
    .from("cfa_applications")
    .select("id")
    .eq("profile_id", userId)
    .limit(30);
  const ids = new Set(
    (byProfile.data ?? []).map((a) => String((a as { id: string }).id)),
  );

  const emailRes = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
  const mail = String((emailRes.data as { email?: string } | null)?.email ?? "")
    .trim()
    .toLowerCase();
  if (mail) {
    const byEmail = await db
      .from("cfa_applications")
      .select("id")
      .ilike("email", mail)
      .limit(30);
    for (const row of byEmail.data ?? []) {
      ids.add(String((row as { id: string }).id));
    }
  }
  return [...ids];
}

async function resolveFromPlacement(
  db: SupabaseClient,
  userId: string,
): Promise<LearnerSituationDetails | null> {
  const appIds = await loadApplicationIds(db, userId);
  if (!appIds.length) return null;

  const placement = await db
    .from("apprentice_placements")
    .select("id, company_id, tutor_id, apprentice_id, status")
    .in("apprentice_id", appIds)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (placement.error || !placement.data) return null;

  const p = placement.data as {
    company_id: string;
    tutor_id: string | null;
    apprentice_id: string;
    status: string;
  };

  let tutorUserId: string | null = null;
  if (p.tutor_id) {
    const tutor = await db
      .from("company_tutors")
      .select("user_id")
      .eq("id", p.tutor_id)
      .maybeSingle();
    tutorUserId = tutor.data
      ? String((tutor.data as { user_id?: string | null }).user_id ?? "") || null
      : null;
  }

  return {
    situation: "apprentice",
    activeContractId: null,
    companyId: p.company_id,
    tutorId: tutorUserId,
    applicationId: p.apprentice_id,
    showAlternanceNav: true,
  };
}

export async function resolveLearnerSituation(
  db: SupabaseClient,
  userId: string,
): Promise<LearnerSituationDetails> {
  const empty: LearnerSituationDetails = {
    situation: "learner",
    activeContractId: null,
    companyId: null,
    tutorId: null,
    applicationId: null,
    showAlternanceNav: false,
  };
  if (!userId) return empty;

  // 1) Contrat d'alternance actif → apprentice
  const contractRes = await db
    .from("alternance_contracts")
    .select("id, company_id, tutor_id, application_id")
    .eq("apprentice_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!contractRes.error && contractRes.data) {
    const row = contractRes.data as {
      id: string;
      company_id: string;
      tutor_id: string | null;
      application_id: string | null;
    };
    return {
      situation: "apprentice",
      activeContractId: row.id,
      companyId: row.company_id,
      tutorId: row.tutor_id,
      applicationId: row.application_id,
      showAlternanceNav: true,
    };
  }

  // 2) Placement CFA ouvert (entreprise assignée, même sans tuteur / contrat encore)
  //    Couvre aussi le cas où la table contrats existe mais n'a pas encore de ligne.
  const fromPlacement = await resolveFromPlacement(db, userId);
  if (fromPlacement) return fromPlacement;

  // Ancien fallback si la table contrats n'existe pas encore (erreur schéma)
  if (
    contractRes.error &&
    /alternance_contracts|schema cache|does not exist/i.test(contractRes.error.message)
  ) {
    const again = await resolveFromPlacement(db, userId);
    if (again) return again;
  }

  // 3) Salarié entreprise (Business) → employee
  const profile = await db
    .from("profiles")
    .select("role, role_type, company_id, entreprise_id")
    .eq("id", userId)
    .maybeSingle();
  const prof = profile.data as {
    role?: string | null;
    role_type?: string | null;
    company_id?: string | null;
    entreprise_id?: string | null;
  } | null;
  const role = normalizeRole(prof?.role);
  const roleType = normalizeRole(prof?.role_type);
  const hasCompany = Boolean(prof?.company_id || prof?.entreprise_id);
  if (EMPLOYEE_ROLES.has(role) || EMPLOYEE_ROLES.has(roleType) || (hasCompany && roleType === "salarie")) {
    return { ...empty, situation: "employee" };
  }

  // 4) Candidature Byound School ouverte → candidate
  const candidature = await db
    .from("cfa_applications")
    .select("id, status")
    .eq("profile_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  for (const row of candidature.data ?? []) {
    const status = String((row as { status?: string }).status ?? "");
    if (OPEN_CANDIDATURE_STATUSES.has(status)) {
      return {
        ...empty,
        situation: "candidate",
        applicationId: String((row as { id: string }).id),
      };
    }
  }

  // Fallback email match for candidatures not yet linked to profile
  const email = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
  const mail = String((email.data as { email?: string } | null)?.email ?? "")
    .trim()
    .toLowerCase();
  if (mail) {
    const byEmail = await db
      .from("cfa_applications")
      .select("id, status")
      .ilike("email", mail)
      .is("profile_id", null)
      .order("updated_at", { ascending: false })
      .limit(3);
    for (const row of byEmail.data ?? []) {
      const status = String((row as { status?: string }).status ?? "");
      if (OPEN_CANDIDATURE_STATUSES.has(status)) {
        return {
          ...empty,
          situation: "candidate",
          applicationId: String((row as { id: string }).id),
        };
      }
    }
  }

  return empty;
}

export function learnerSituationLabel(situation: LearnerSituation): string {
  switch (situation) {
    case "apprentice":
      return "En alternance";
    case "employee":
      return "Salarié";
    case "candidate":
      return "Candidat Byound School";
    default:
      return "Apprenant";
  }
}
