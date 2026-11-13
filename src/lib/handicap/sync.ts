import type { SupabaseClient } from "@supabase/supabase-js";
import { revealCerfaField } from "@/lib/cfa/sensitive";

export type HandicapScope = "business" | "school";
export type HandicapSourceKind = "employee" | "formation_participant" | "cfa_application";

export type UpsertHandicapProfileInput = {
  scope: HandicapScope;
  sourceKind: HandicapSourceKind;
  sourceId: string;
  organizationId?: string | null;
  personName: string;
  personEmail?: string | null;
  rqth: boolean;
  needsSummary?: string | null;
};

function isRqthOui(value: string) {
  const n = value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return n === "oui" || n === "yes" || n === "1" || n === "true";
}

/** RQTH déclarée « Oui » dans le CERFA (valeur déchiffrée). */
export function cerfaRqthIsYes(cerfa: Record<string, string> | null | undefined): boolean {
  const plain = revealCerfaField(cerfa, "rqth");
  return isRqthOui(plain);
}

export async function upsertHandicapProfile(
  service: SupabaseClient,
  input: UpsertHandicapProfileInput,
): Promise<{ id: string } | null> {
  const now = new Date().toISOString();
  const row = {
    scope: input.scope,
    source_kind: input.sourceKind,
    source_id: input.sourceId,
    organization_id: input.organizationId || null,
    person_name: input.personName.trim() || "Sans nom",
    person_email: input.personEmail?.trim().toLowerCase() || null,
    rqth: input.rqth,
    active: input.rqth,
    needs_summary: input.needsSummary?.trim() || null,
    updated_at: now,
  };

  const { data, error } = await service
    .from("handicap_profiles")
    .upsert(row, { onConflict: "source_kind,source_id" })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[handicap] upsert failed", error.message);
    return null;
  }
  return data?.id ? { id: String(data.id) } : null;
}

export async function syncEmployeeHandicapProfile(
  service: SupabaseClient,
  employee: {
    id: string;
    company_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    rqth?: boolean | null;
    rqth_needs_summary?: string | null;
  },
) {
  const name =
    [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() ||
    String(employee.email ?? "").trim() ||
    "Collaborateur";
  return upsertHandicapProfile(service, {
    scope: "business",
    sourceKind: "employee",
    sourceId: employee.id,
    organizationId: employee.company_id,
    personName: name,
    personEmail: employee.email,
    rqth: Boolean(employee.rqth),
    needsSummary: employee.rqth_needs_summary,
  });
}

export async function syncParticipantHandicapProfile(
  service: SupabaseClient,
  participant: {
    id: string;
    dossier_id: string;
    rqth?: boolean | null;
    needs_specific_support?: boolean | null;
  },
  meta: {
    organizationId?: string | null;
    personName: string;
    personEmail?: string | null;
    needsSummary?: string | null;
  },
) {
  const rqth = Boolean(participant.rqth);
  return upsertHandicapProfile(service, {
    scope: "business",
    sourceKind: "formation_participant",
    sourceId: participant.id,
    organizationId: meta.organizationId,
    personName: meta.personName,
    personEmail: meta.personEmail,
    rqth,
    needsSummary:
      meta.needsSummary ||
      (participant.needs_specific_support ? "Besoin spécifique déclaré" : null),
  });
}

export async function syncCfaApplicationHandicapProfile(
  service: SupabaseClient,
  application: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    specialization?: string | null;
    cerfa_data?: Record<string, string> | null;
  },
) {
  const cerfa = (application.cerfa_data ?? {}) as Record<string, string>;
  const rqth = cerfaRqthIsYes(cerfa);
  const nameFromCerfa = [cerfa.firstNames || cerfa.firstName, cerfa.lastName || cerfa.familyName]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const name =
    nameFromCerfa ||
    [application.first_name, application.last_name].filter(Boolean).join(" ").trim() ||
    String(application.email ?? cerfa.email ?? "").trim() ||
    "Apprenant CFA";
  const needs =
    rqth
      ? `RQTH déclarée (CERFA CFA)${application.specialization ? ` · ${application.specialization}` : ""}`
      : null;
  return upsertHandicapProfile(service, {
    scope: "school",
    sourceKind: "cfa_application",
    sourceId: application.id,
    organizationId: null,
    personName: name,
    personEmail: application.email || cerfa.email || null,
    rqth,
    needsSummary: needs,
  });
}

/** Backfill School depuis les candidatures CFA déjà en base. */
export async function backfillCfaHandicapProfiles(service: SupabaseClient): Promise<number> {
  const { data, error } = await service
    .from("cfa_applications")
    .select("id, first_name, last_name, email, specialization, cerfa_data")
    .not("cerfa_data", "is", null)
    .limit(2000);
  if (error) {
    console.error("[handicap] cfa backfill", error.message);
    return 0;
  }
  let count = 0;
  for (const row of data ?? []) {
    const cerfa = (row.cerfa_data ?? {}) as Record<string, string>;
    if (!String(cerfa.rqth ?? "").trim()) continue;
    const result = await syncCfaApplicationHandicapProfile(service, {
      id: String(row.id),
      first_name: row.first_name ? String(row.first_name) : null,
      last_name: row.last_name ? String(row.last_name) : null,
      email: row.email ? String(row.email) : null,
      specialization: row.specialization ? String(row.specialization) : null,
      cerfa_data: cerfa,
    });
    if (result && cerfaRqthIsYes(cerfa)) count += 1;
  }
  return count;
}
