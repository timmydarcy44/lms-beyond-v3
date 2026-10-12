import { getServiceRoleClient } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof getServiceRoleClient>>;

export async function loadCfaApplicationBoard(db: Db) {
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
          ? db.storage.from("cfa-applications").createSignedUrl(String(application.cv_path), 3600)
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
      return {
        ...application,
        cv_url: cvSigned.data?.signedUrl ?? null,
        motivation_media_signed_url: motivationSigned.data?.signedUrl ?? application.motivation_media_url ?? null,
        administrative_document_urls: Object.fromEntries(documentEntries),
        private_files: Object.fromEntries(privateFileEntries),
      };
    }),
  );

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
    applications,
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
  return { companies: data ?? [] };
}
