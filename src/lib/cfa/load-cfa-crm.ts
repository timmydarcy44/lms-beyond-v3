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

  const applications = await Promise.all(
    (data ?? []).map(async (application) => {
      const documents = (application.administrative_documents ?? {}) as Record<string, string>;
      const privateFiles = (application.private_files ?? {}) as Record<
        string,
        { path?: string; [key: string]: unknown }
      >;
      const [cvSigned, motivationSigned, documentEntries, privateFileEntries] = await Promise.all([
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
            const signed = metadata.path
              ? await db.storage.from("cfa-applications").createSignedUrl(String(metadata.path), 3600)
              : { data: null };
            return [kind, { ...metadata, signed_url: signed.data?.signedUrl ?? null }] as const;
          }),
        ),
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
        cerfa_data: presentCerfa(merged.cerfa, access),
        cv_url: cvSigned.data?.signedUrl ?? null,
        motivation_media_signed_url: motivationSigned.data?.signedUrl ?? application.motivation_media_url ?? null,
        administrative_document_urls: Object.fromEntries(documentEntries),
        private_files: Object.fromEntries(privateFileEntries),
      };
    }),
  );

  const appIds = applications.map((row) => String((row as { id: string }).id));
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

  const applicationsWithPlacement = applications.map((application) => {
    const id = String((application as { id: string }).id);
    const placement = placementByApp.get(id) ?? null;
    return {
      ...application,
      placement,
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
