import type { SupabaseClient } from "@supabase/supabase-js";

export type ApplicationStage = "new" | "interview" | "retained" | "rejected";

export type StageCounts = {
  new: number;
  interview: number;
  retained: number;
};

export type CountedApplication = {
  stage?: string | null;
  status?: string | null;
  read_at?: string | null;
};

export type LoadedApplication = {
  id: string;
  job_id: string;
  talent_id: string | null;
  status: string | null;
  stage: string | null;
  source: string | null;
  interview_at: string | null;
  created_at: string | null;
  read_at?: string | null;
  name?: string | null;
};

const REJECTED = new Set(["rejected", "refus", "refused", "declined"]);
const INTERVIEW = new Set(["interview", "entretien", "interviewing"]);
const RETAINED = new Set(["retained", "retenu", "retenue", "accepted", "hired"]);

export function applicationStage(row: CountedApplication): ApplicationStage {
  const explicit = String(row.stage ?? "").toLowerCase();
  if (explicit === "new" || explicit === "interview" || explicit === "retained" || explicit === "rejected") {
    return explicit;
  }
  const status = String(row.status ?? "").toLowerCase();
  if (REJECTED.has(status)) return "rejected";
  if (INTERVIEW.has(status)) return "interview";
  if (RETAINED.has(status)) return "retained";
  return "new";
}

export function applicationRevealsCompany(row: CountedApplication) {
  const stage = applicationStage(row);
  return stage === "interview" || stage === "retained";
}

export function isUnreadApplication(row: CountedApplication, stage = applicationStage(row)) {
  if (stage === "rejected") return false;
  if ("read_at" in row) return !row.read_at;
  return stage === "new";
}

export function summarizeApplications(rows: CountedApplication[]) {
  const stages: StageCounts = { new: 0, interview: 0, retained: 0 };
  let unread = 0;
  for (const row of rows) {
    const stage = applicationStage(row);
    if (stage === "rejected") continue;
    stages[stage] += 1;
    if (isUnreadApplication(row, stage)) unread += 1;
  }
  const total = stages.new + stages.interview + stages.retained;
  return { total, unread, stages };
}

function missingColumn(message: string) {
  return /column|schema cache|42703|does not exist/i.test(message);
}

function visibleToCompany(status: string | null) {
  const value = String(status ?? "").toLowerCase();
  return value !== "draft" && value !== "archived";
}

export async function fetchApplications(service: SupabaseClient, offerIds: string[]): Promise<LoadedApplication[]> {
  if (offerIds.length === 0) return [];
  const rich = await service
    .from("applications")
    .select("id, job_id, talent_id, status, stage, read_at, source, interview_at, created_at")
    .in("job_id", offerIds)
    .order("created_at", { ascending: false });

  if (!rich.error) {
    return (rich.data ?? []).filter((row) => visibleToCompany((row.status as string | null) ?? null)).map((row) => ({
      id: String(row.id),
      job_id: String(row.job_id ?? ""),
      talent_id: (row.talent_id as string | null) ?? null,
      status: (row.status as string | null) ?? null,
      stage: (row.stage as string | null) ?? null,
      source: (row.source as string | null) ?? null,
      interview_at: (row.interview_at as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null,
      read_at: (row.read_at as string | null) ?? null,
    }));
  }

  if (!missingColumn(rich.error.message)) return [];

  const basic = await service
    .from("applications")
    .select("id, job_id, talent_id, status, created_at")
    .in("job_id", offerIds)
    .order("created_at", { ascending: false });

  return (basic.data ?? []).filter((row) => visibleToCompany((row.status as string | null) ?? null)).map((row) => ({
    id: String(row.id),
    job_id: String(row.job_id ?? ""),
    talent_id: (row.talent_id as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    stage: null,
    source: null,
    interview_at: null,
    created_at: (row.created_at as string | null) ?? null,
  }));
}

/** Même jeu de candidatures que le détail d'une offre démo. */
export function demoApplicationRows(offerId: string): LoadedApplication[] {
  const now = Date.now();
  return [
    {
      id: `${offerId}-app-1`,
      job_id: offerId,
      talent_id: "edgebs-cand-1",
      status: "pending",
      stage: "new",
      source: null,
      interview_at: null,
      created_at: new Date(now - 2 * 86400000).toISOString(),
      read_at: null,
      name: "Léa Bernard",
    },
    {
      id: `${offerId}-app-2`,
      job_id: offerId,
      talent_id: "edgebs-cand-2",
      status: "pending",
      stage: "new",
      source: null,
      interview_at: null,
      created_at: new Date(now - 5 * 86400000).toISOString(),
      read_at: null,
      name: "Hugo Moreau",
    },
  ];
}
