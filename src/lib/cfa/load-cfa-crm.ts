import { withSignedChallengeResponses } from "@/lib/cfa/sign-challenge-media";
import { hasSensitiveKey, mergeSealedCerfa, presentCerfa } from "@/lib/cfa/sensitive";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof getServiceRoleClient>>;

export async function loadCfaApplicationBoard(db: Db, access: "staff" | "admin" = "staff") {
  const { data, error } = await db
    .from("cfa_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return { applications: [], migrationRequired: true, downloads: [], downloadsMigrationRequired: false };
    return { error: error.message };
  }

  // Corrige les dossiers en « Revue / Décision » sans entretien réalisé → Entretien.
  for (const row of data ?? []) {
    const status = String((row as { status?: string }).status ?? "");
    const realized = (row as { interview_realized_at?: string | null }).interview_realized_at;
    if (status === "review" && !realized) {
      const { error: fixError } = await db
        .from("cfa_applications")
        .update({ status: "interview" })
        .eq("id", (row as { id: string }).id);
      if (!fixError) (row as { status: string }).status = "interview";
    }
  }

  const applications = await Promise.all(
    (data ?? []).map(async (application) => {
      const documents = (application.administrative_documents ?? {}) as Record<string, string>;
      const privateFiles = (application.private_files ?? {}) as Record<
        string,
        { path?: string; bucket?: string; [key: string]: unknown }
      >;
      const [cvSigned, motivationSigned, documentEntries, privateFileEntries, challengeV2Signed] = await Promise.all([
        application.cv_path
          ? String(application.cv_path).startsWith("http")
            ? Promise.resolve({ data: { signedUrl: String(application.cv_path) } })
            : db.storage.from("cfa-applications").createSignedUrl(String(application.cv_path), 3600)
          : Promise.resolve({ data: null }),
        application.motivation_media_url && !String(application.motivation_media_url).startsWith("http")
          ? db.storage.from("cfa-applications").createSignedUrl(String(application.motivation_media_url), 3600)
          : Promise.resolve({ data: null }),
        Promise.all(
          Object.entries(documents).map(async ([kind, path]) => {
            const signed = await db.storage.from("cfa-applications").createSignedUrl(String(path), 3600);
            return [kind, signed.data?.signedUrl ?? ""] as const;
          }),
        ),
        Promise.all(
          Object.entries(privateFiles).map(async ([kind, metadata]) => {
            const bucket = String(metadata.bucket || "cfa-applications");
            const signed = metadata.path
              ? await db.storage.from(bucket).createSignedUrl(String(metadata.path), 3600)
              : { data: null };
            return [kind, { ...metadata, signed_url: signed.data?.signedUrl ?? null }] as const;
          }),
        ),
        withSignedChallengeResponses(db, application.challenge_v2 as Record<string, unknown> | null),
      ]);
      const storedCerfa = (application.cerfa_data ?? {}) as Record<string, string>;
      const merged = mergeSealedCerfa(storedCerfa, {});
      if (
        hasSensitiveKey() &&
        (merged.cerfa.socialSecurityNumber !== storedCerfa.socialSecurityNumber || merged.cerfa.rqth !== storedCerfa.rqth)
      ) {
        await db.from("cfa_applications").update({ cerfa_data: merged.cerfa }).eq("id", application.id);
      }
      return {
        ...application,
        challenge_v2: challengeV2Signed,
        cerfa_data: presentCerfa(merged.cerfa, access),
        cv_url: cvSigned.data?.signedUrl ?? null,
        motivation_media_signed_url: motivationSigned.data?.signedUrl ?? application.motivation_media_url ?? null,
        administrative_document_urls: Object.fromEntries(documentEntries),
        private_files: Object.fromEntries(privateFileEntries),
      };
    }),
  );

  const appIds = applications.map((row) => String((row as { id: string }).id));
  const accessibilityQuery = appIds.length
    ? await db
        .from("admission_accessibility")
        .select("application_id, needs_accommodation")
        .in("application_id", appIds)
    : { data: [], error: null };
  // Ignore missing table until migration applied.
  const accommodationByApp = new Map<string, boolean>();
  for (const row of (accessibilityQuery.error ? [] : accessibilityQuery.data ?? []) as Array<{
    application_id: string;
    needs_accommodation: boolean | null;
  }>) {
    // Flag booléen uniquement — jamais de motif ni RQTH vers le jury.
    if (row.needs_accommodation === true) accommodationByApp.set(row.application_id, true);
  }
  const placementsQuery = appIds.length
    ? await db
        .from("apprentice_placements")
        .select("apprentice_id, company_id, status")
        .in("apprentice_id", appIds)
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  const placementRows = (placementsQuery.error ? [] : placementsQuery.data ?? []) as Array<{
    apprentice_id: string;
    company_id: string;
    status: string;
  }>;
  const companyIds = [...new Set(placementRows.map((row) => row.company_id))];
  const companiesQuery = companyIds.length
    ? await db.from("cfa_companies").select("id, company_name").in("id", companyIds)
    : { data: [], error: null };
  const companyNames = new Map(
    ((companiesQuery.error ? [] : companiesQuery.data ?? []) as Array<{ id: string; company_name: string }>).map(
      (row) => [row.id, row.company_name],
    ),
  );
  const placementByApp = new Map<string, { companyId: string; companyName: string; status: "pending" | "active" }>();
  for (const row of placementRows) {
    if (placementByApp.has(row.apprentice_id)) continue;
    placementByApp.set(row.apprentice_id, {
      companyId: row.company_id,
      companyName: companyNames.get(row.company_id) || "Entreprise",
      status: row.status === "active" ? "active" : "pending",
    });
  }

  const creatorIds = [
    ...new Set(
      applications
        .map((application) => String((application as { created_by?: string | null }).created_by ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const creatorsQuery = creatorIds.length
    ? await db.from("profiles").select("id, first_name, last_name, email, full_name").in("id", creatorIds)
    : { data: [], error: null };
  const creatorById = new Map(
    ((creatorsQuery.error ? [] : creatorsQuery.data ?? []) as Array<{
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      full_name?: string | null;
    }>).map((row) => [row.id, row]),
  );
  const promotedQuery = appIds.length
    ? await db.from("cfa_person_touches").select("person_id").eq("type", "stage_change").in("person_id", appIds)
    : { data: [], error: null };
  const promotedIds = new Set(
    ((promotedQuery.error ? [] : promotedQuery.data ?? []) as Array<{ person_id: string }>).map((row) => row.person_id),
  );

  const applicationsWithPlacement = applications.map((application) => {
    const id = String((application as { id: string }).id);
    const placement = placementByApp.get(id) ?? null;
    const createdBy = String((application as { created_by?: string | null }).created_by ?? "").trim();
    const creator = createdBy ? creatorById.get(createdBy) : null;
    const first = String(creator?.first_name ?? creator?.full_name?.split(" ")[0] ?? "").trim();
    const last = String(creator?.last_name ?? "").trim();
    const initials = (first.charAt(0) + last.charAt(0)).toUpperCase() || String(creator?.email ?? "").slice(0, 2).toUpperCase();
    const label = first && last ? `${first} ${last.slice(0, 1)}.` : first || null;
    return {
      ...application,
      placement,
      interview_accommodation_needed: accommodationByApp.get(id) === true,
      created_by_initials: initials || null,
      created_by_label: label,
      promoted_from_prospect: promotedIds.has(id) || String((application as { first_touch?: string }).first_touch ?? "") === "web_brochure",
    };
  });

  const downloadsQuery = await db
    .from("cfa_program_downloads")
    .select("id,first_name,last_name,email,phone,specialization,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const downloadsMissing = downloadsQuery.error?.code === "42P01";
  if (downloadsQuery.error && !downloadsMissing) {
    return { error: downloadsQuery.error.message };
  }

  return {
    applications: applicationsWithPlacement,
    downloads: downloadsMissing ? [] : (downloadsQuery.data ?? []),
    downloadsMigrationRequired: downloadsMissing,
  };
}

export async function loadCfaCompanies(db: Db) {
  const { data, error } = await db.from("cfa_companies").select("*").order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "42703") return { companies: [], migrationRequired: true };
    return { error: error.message };
  }
  const { isByoundBusinessSiret } = await import("@/lib/cfa/host-company-stages");
  const companies = ((data ?? []) as Array<Record<string, unknown>>).filter(
    (company) => !isByoundBusinessSiret(company.siret ? String(company.siret) : null),
  );
  const companyIds = companies.map((c) => String(c.id ?? "")).filter(Boolean);
  const emptyId = "00000000-0000-0000-0000-000000000000";
  const ids = companyIds.length ? companyIds : [emptyId];

  const [openActions, activities, audits, placements] = await Promise.all([
    db
      .from("cfa_company_activities")
      .select("company_id, next_action, next_action_at")
      .is("done_at", null)
      .not("next_action_at", "is", null)
      .in("company_id", ids),
    db
      .from("cfa_company_activities")
      .select("company_id, created_at")
      .in("company_id", ids)
      .order("created_at", { ascending: false }),
    db
      .from("cfa_audit_events")
      .select("company_id, created_at")
      .eq("action", "company_status")
      .in("company_id", ids)
      .order("created_at", { ascending: false }),
    db.from("apprentice_placements").select("company_id, status").in("company_id", ids),
  ]);

  const openActionByCompany = new Map<string, { next_action: string | null; next_action_at: string | null }>();
  for (const row of (openActions.error ? [] : openActions.data ?? []) as Array<{
    company_id: string;
    next_action: string | null;
    next_action_at: string | null;
  }>) {
    if (!openActionByCompany.has(String(row.company_id))) {
      openActionByCompany.set(String(row.company_id), {
        next_action: row.next_action,
        next_action_at: row.next_action_at,
      });
    }
  }

  const lastActivityByCompany = new Map<string, string>();
  for (const row of (activities.error ? [] : activities.data ?? []) as Array<{
    company_id: string;
    created_at: string;
  }>) {
    const id = String(row.company_id);
    if (!lastActivityByCompany.has(id)) lastActivityByCompany.set(id, row.created_at);
  }

  const lastStatusAtByCompany = new Map<string, string>();
  for (const row of (audits.error ? [] : audits.data ?? []) as Array<{
    company_id: string;
    created_at: string;
  }>) {
    const id = String(row.company_id);
    if (!lastStatusAtByCompany.has(id)) lastStatusAtByCompany.set(id, row.created_at);
  }

  const proposedByCompany = new Map<string, number>();
  const recruitedByCompany = new Map<string, number>();
  for (const row of (placements.error ? [] : placements.data ?? []) as Array<{
    company_id: string;
    status: string | null;
  }>) {
    const id = String(row.company_id);
    if (row.status === "pending") proposedByCompany.set(id, (proposedByCompany.get(id) ?? 0) + 1);
    if (row.status === "active") recruitedByCompany.set(id, (recruitedByCompany.get(id) ?? 0) + 1);
  }

  return {
    companies: companies.map((company) => {
      const id = String(company.id ?? "");
      const action = openActionByCompany.get(id);
      const lastStatusAt = lastStatusAtByCompany.get(id) ?? null;
      const lastActivityAt = lastActivityByCompany.get(id) ?? null;
      return {
        ...company,
        next_action: action?.next_action ?? null,
        next_action_at: action?.next_action_at ?? null,
        last_status_at: lastStatusAt,
        last_action_at:
          lastStatusAt || lastActivityAt || (company.updated_at ? String(company.updated_at) : null),
        candidates_proposed: proposedByCompany.get(id) ?? 0,
        apprentices_recruited: recruitedByCompany.get(id) ?? 0,
      };
    }),
  };
}
