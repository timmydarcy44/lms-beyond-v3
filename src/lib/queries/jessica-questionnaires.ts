import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  JESSICA_QUESTIONNAIRES,
  JESSICA_QUESTIONNAIRE_SLUGS,
  type JessicaQuestionDef,
  type JessicaQuestionnaireDef,
  normalizePersonKey,
} from "@/lib/jessica-contentin/questionnaires";

export type JessicaQuestionnaireRow = JessicaQuestionnaireDef & {
  id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type JessicaQuestionnaireResponseRow = {
  id: string;
  questionnaire_slug: string;
  questionnaire_id?: string | null;
  external_id: string | null;
  respondent_email: string | null;
  respondent_first_name: string | null;
  respondent_last_name: string | null;
  respondent_phone: string | null;
  child_first_name: string | null;
  child_last_name: string | null;
  cabinet_patient_id: string | null;
  profile_id: string | null;
  answers: Record<string, unknown>;
  score: number | null;
  score_label: string | null;
  submitted_at: string | null;
  source: string;
  created_at: string;
};

function mapQuestionnaireRow(row: Record<string, unknown>): JessicaQuestionnaireRow {
  const questions = Array.isArray(row.questions) ? (row.questions as JessicaQuestionDef[]) : [];
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    questions,
    is_active: row.is_active !== false,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/** Charge les questionnaires actifs depuis la DB (vide si table absente). */
export async function listJessicaQuestionnairesFromDb(opts?: {
  includeInactive?: boolean;
}): Promise<JessicaQuestionnaireRow[]> {
  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  let q = supabase.from("jessica_questionnaires").select("*").order("title", { ascending: true });
  if (!opts?.includeInactive) q = q.eq("is_active", true);

  const { data, error } = await q;
  if (error) {
    console.error("[jessica-questionnaires] list defs", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapQuestionnaireRow(row as Record<string, unknown>));
}

export async function getJessicaQuestionnaireFromDb(
  slug: string,
): Promise<JessicaQuestionnaireRow | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("jessica_questionnaires")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[jessica-questionnaires] get def", error.message);
    return null;
  }
  if (!data) return null;
  return mapQuestionnaireRow(data as Record<string, unknown>);
}

/** DB d’abord, sinon définitions Typeform embarquées. */
export async function resolveJessicaQuestionnaire(
  slug: string,
): Promise<JessicaQuestionnaireDef | null> {
  const fromDb = await getJessicaQuestionnaireFromDb(slug);
  if (fromDb) return fromDb;
  return JESSICA_QUESTIONNAIRES[slug] ?? null;
}

export async function listResolvedJessicaQuestionnaires(): Promise<JessicaQuestionnaireDef[]> {
  const fromDb = await listJessicaQuestionnairesFromDb();
  if (fromDb.length > 0) return fromDb;
  return JESSICA_QUESTIONNAIRE_SLUGS.map((slug) => JESSICA_QUESTIONNAIRES[slug]);
}

/** Insère les 5 questionnaires Typeform s’ils n’existent pas encore. */
export async function seedBuiltinJessicaQuestionnaires(createdBy?: string) {
  const supabase = getServiceRoleClient();
  if (!supabase) return { seeded: 0, error: "Supabase indisponible" };

  const rows = JESSICA_QUESTIONNAIRE_SLUGS.map((slug) => {
    const def = JESSICA_QUESTIONNAIRES[slug];
    return {
      slug: def.slug,
      title: def.title,
      description: def.description,
      questions: def.questions,
      is_active: true,
      updated_at: new Date().toISOString(),
      created_by: createdBy ?? null,
    };
  });

  const { error, count } = await supabase
    .from("jessica_questionnaires")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: true, count: "exact" });

  if (error) {
    console.error("[jessica-questionnaires] seed", error);
    return { seeded: 0, error: error.message };
  }
  return { seeded: count ?? rows.length };
}

export function slugifyQuestionnaireTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base || `questionnaire-${Date.now()}`;
}

export async function createJessicaQuestionnaire(input: {
  title: string;
  description?: string;
  slug?: string;
  questions?: JessicaQuestionDef[];
  createdBy?: string;
}): Promise<{ row?: JessicaQuestionnaireRow; error?: string }> {
  const supabase = getServiceRoleClient();
  if (!supabase) return { error: "Supabase indisponible" };

  let slug = (input.slug?.trim() || slugifyQuestionnaireTitle(input.title)).slice(0, 80);
  const existing = await getJessicaQuestionnaireFromDb(slug);
  if (existing && input.slug?.trim()) {
    return updateJessicaQuestionnaire(existing.id, {
      title: input.title.trim(),
      description: input.description?.trim() || "",
      questions: input.questions ?? [],
    });
  }
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const { data, error } = await supabase
    .from("jessica_questionnaires")
    .insert({
      slug,
      title: input.title.trim(),
      description: input.description?.trim() || "",
      questions: input.questions ?? [],
      is_active: true,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { row: mapQuestionnaireRow(data as Record<string, unknown>) };
}

export async function updateJessicaQuestionnaire(
  id: string,
  input: {
    title?: string;
    description?: string;
    questions?: JessicaQuestionDef[];
    is_active?: boolean;
  },
): Promise<{ row?: JessicaQuestionnaireRow; error?: string }> {
  const supabase = getServiceRoleClient();
  if (!supabase) return { error: "Supabase indisponible" };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title != null) patch.title = input.title.trim();
  if (input.description != null) patch.description = input.description.trim();
  if (input.questions != null) patch.questions = input.questions;
  if (input.is_active != null) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("jessica_questionnaires")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { row: mapQuestionnaireRow(data as Record<string, unknown>) };
}

export async function listJessicaQuestionnaireResponses(slug?: string) {
  const supabase = getServiceRoleClient();
  if (!supabase) return [] as JessicaQuestionnaireResponseRow[];

  let q = supabase
    .from("jessica_questionnaire_responses")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (slug) q = q.eq("questionnaire_slug", slug);

  const { data, error } = await q.limit(2000);
  if (error) {
    console.error("[jessica-questionnaires] list", error);
    return [];
  }
  return (data ?? []) as JessicaQuestionnaireResponseRow[];
}

export async function countJessicaQuestionnaireResponsesBySlug(): Promise<Record<string, number>> {
  const rows = await listJessicaQuestionnaireResponses();
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.questionnaire_slug] = (counts[row.questionnaire_slug] ?? 0) + 1;
  }
  return counts;
}

export async function getJessicaQuestionnaireResponse(id: string) {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("jessica_questionnaire_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[jessica-questionnaires] get", error);
    return null;
  }
  return data as JessicaQuestionnaireResponseRow | null;
}

type MatchTarget = {
  profileId?: string | null;
  patientId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
};

export async function getJessicaQuestionnaireResponsesForClient(target: MatchTarget) {
  const all = await listJessicaQuestionnaireResponses();
  const email = target.email?.trim().toLowerCase() || null;
  const first = normalizePersonKey(target.firstName);
  const last = normalizePersonKey(target.lastName);
  const full = normalizePersonKey(target.fullName);

  return all.filter((row) => {
    if (target.profileId && row.profile_id === target.profileId) return true;
    if (target.patientId && row.cabinet_patient_id === target.patientId) return true;
    if (email && row.respondent_email?.toLowerCase() === email) return true;

    const childFirst = normalizePersonKey(row.child_first_name);
    const childLast = normalizePersonKey(row.child_last_name);
    const respFirst = normalizePersonKey(row.respondent_first_name);
    const respLast = normalizePersonKey(row.respondent_last_name);

    if (first && last) {
      if (childFirst === first && childLast === last) return true;
      if (respFirst === first && respLast === last) return true;
      if (childLast.includes(last) || last.includes(childLast)) {
        if (!childFirst || childFirst.includes(first) || first.includes(childFirst)) return true;
      }
      if (respLast.includes(last) || last.includes(respLast)) {
        if (!respFirst || respFirst.includes(first) || first.includes(respFirst)) return true;
      }
    }
    if (full && last) {
      if (full.includes(childLast) && childFirst && full.includes(childFirst)) return true;
      if (full.includes(respLast) && respFirst && full.includes(respFirst)) return true;
      if (childLast && full.includes(childLast.split(" ").pop() || "")) {
        if (childFirst && full.includes(childFirst)) return true;
      }
    }
    if (
      last &&
      (childLast === last ||
        respLast === last ||
        childLast.includes(last) ||
        last.includes(childLast))
    ) {
      if (!first) return true;
      if (childFirst.includes(first) || first.includes(childFirst)) return true;
      if (respFirst.includes(first) || first.includes(respFirst)) return true;
    }
    return false;
  });
}
