/**
 * Persistance du dossier de preuves comportementales EDGE.
 */

import type { PostgrestError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeSkillProofMatrix,
  emptyEvidenceForGrid,
  mergeEvidenceEntries,
  type BehaviorEvidenceEntry,
  type BehaviorObservationRecord,
  type SkillProofMatrix,
} from "@/lib/apprenant/edge-behavior-evidence";
import { getBehaviorGrid } from "@/lib/apprenant/edge-behavior-grids";
import { normalizeSkillSlug } from "@/lib/apprenant/edge-mission-types";

type DB = SupabaseClient;

function isSchemaMismatchError(error: PostgrestError | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("edge_skill_behavior_evidence")
  );
}

function rowToEntry(row: Record<string, unknown>): BehaviorEvidenceEntry {
  const observations = Array.isArray(row.observations)
    ? (row.observations as BehaviorObservationRecord[])
    : [];
  return {
    behaviorKey: String(row.behavior_key ?? ""),
    behaviorLabel: String(row.behavior_label ?? ""),
    observations,
    missionContexts: Array.isArray(row.mission_contexts) ? row.mission_contexts.map(String) : [],
    observationCount: Number(row.observation_count) || observations.length,
    firstObservedAt: row.first_observed_at ? String(row.first_observed_at) : undefined,
    lastObservedAt: row.last_observed_at ? String(row.last_observed_at) : undefined,
  };
}

export async function fetchSkillBehaviorEvidence(
  db: DB,
  userId: string,
  skillName: string,
): Promise<BehaviorEvidenceEntry[]> {
  const grid = getBehaviorGrid(skillName);
  const slug = normalizeSkillSlug(skillName);
  const { data, error } = await db
    .from("edge_skill_behavior_evidence")
    .select("*")
    .eq("user_id", userId)
    .eq("skill_slug", slug);

  if (error) {
    if (!isSchemaMismatchError(error)) {
      console.warn("[edge-behavior-store] fetch", error.message);
    }
    return emptyEvidenceForGrid(grid);
  }

  const entries = (data ?? []).map((r) => rowToEntry(r as Record<string, unknown>));
  const byKey = new Map(entries.map((e) => [e.behaviorKey, e]));
  return grid.behaviors.map((b) => byKey.get(b.key) ?? {
    behaviorKey: b.key,
    behaviorLabel: b.label,
    observations: [],
    missionContexts: [],
    observationCount: 0,
  });
}

export async function persistBehaviorObservations(
  db: DB,
  userId: string,
  skillName: string,
  missionTitle: string,
  newObservations: BehaviorObservationRecord[],
): Promise<BehaviorEvidenceEntry[]> {
  const grid = getBehaviorGrid(skillName);
  const slug = normalizeSkillSlug(skillName);
  const existing = await fetchSkillBehaviorEvidence(db, userId, skillName);
  const merged = mergeEvidenceEntries(existing, newObservations, missionTitle);
  const now = new Date().toISOString();

  for (const entry of merged) {
    if (entry.observationCount === 0) continue;
    const payload = {
      user_id: userId,
      skill_slug: slug,
      skill_name: skillName,
      behavior_key: entry.behaviorKey,
      behavior_label: entry.behaviorLabel,
      observations: entry.observations,
      mission_contexts: entry.missionContexts,
      observation_count: entry.observationCount,
      first_observed_at: entry.firstObservedAt ?? now,
      last_observed_at: entry.lastObservedAt ?? now,
      updated_at: now,
    };

    const { error } = await db.from("edge_skill_behavior_evidence").upsert(payload, {
      onConflict: "user_id,skill_slug,behavior_key",
    });

    if (error && !isSchemaMismatchError(error)) {
      console.warn("[edge-behavior-store] upsert", error.message);
    }
  }

  return merged;
}

export async function buildAndPersistProofMatrix(
  db: DB | null,
  userId: string,
  skillName: string,
  missionTitle: string,
  missionObservations: BehaviorObservationRecord[],
): Promise<SkillProofMatrix> {
  const grid = getBehaviorGrid(skillName);
  let evidence = emptyEvidenceForGrid(grid);

  if (db && missionObservations.length > 0) {
    evidence = await persistBehaviorObservations(db, userId, skillName, missionTitle, missionObservations);
  } else if (missionObservations.length > 0) {
    evidence = mergeEvidenceEntries(evidence, missionObservations, missionTitle);
  } else if (db) {
    evidence = await fetchSkillBehaviorEvidence(db, userId, skillName);
  }

  return computeSkillProofMatrix(skillName, evidence);
}
