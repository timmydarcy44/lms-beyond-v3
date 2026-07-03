import type { SupabaseClient } from "@supabase/supabase-js";
import { logExpertRegisterError } from "@/lib/expert/register-log";

export type ExpertRegistrationRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  is_active: boolean;
  specialties: string[] | null;
  formats_supported: string[] | null;
  review_status: string;
  wants_certification: boolean;
  linkedin_url: string | null;
  references: unknown[];
};

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST204") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("column") && (msg.includes("does not exist") || msg.includes("could not find"));
}

function buildUpsertAttempts(row: ExpertRegistrationRow): Record<string, unknown>[] {
  const full = {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    headline: row.headline,
    specialties: row.specialties,
    formats_supported: row.formats_supported,
    is_active: row.is_active,
    review_status: row.review_status,
    wants_certification: row.wants_certification,
    linkedin_url: row.linkedin_url,
    references: row.references,
  };

  return [
    full,
    {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      headline: row.headline,
      specialties: row.specialties,
      formats_supported: row.formats_supported,
      is_active: row.is_active,
      review_status: row.review_status,
      references: row.references,
    },
    {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      specialties: row.specialties,
      formats_supported: row.formats_supported,
      is_active: row.is_active,
      references: row.references,
    },
    {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      specialties: row.specialties,
      formats_supported: row.formats_supported,
      references: row.references,
    },
    {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
    },
  ];
}

async function tryUpsert(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<{ error: { message?: string; code?: string } | null }> {
  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
  const { error } = await supabase.from("experts").upsert(cleaned, { onConflict: "id" });
  if (!error) return { error: null };
  if (!isMissingColumnError(error)) {
    const { error: emailConflictError } = await supabase
      .from("experts")
      .upsert(cleaned, { onConflict: "email" });
    return { error: emailConflictError };
  }
  return { error };
}

export async function upsertExpertRegistration(
  supabase: SupabaseClient,
  row: ExpertRegistrationRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const attempts = buildUpsertAttempts(row);
  let lastError: { message?: string; code?: string } | null = null;

  for (let i = 0; i < attempts.length; i += 1) {
    const { error } = await tryUpsert(supabase, attempts[i]);
    if (!error) return { ok: true };

    lastError = error;
    logExpertRegisterError("experts_upsert_attempt", error, { attempt: i + 1 });

    if (!isMissingColumnError(error)) break;
  }

  return { ok: false, error: lastError?.message ?? "experts_upsert_failed" };
}
