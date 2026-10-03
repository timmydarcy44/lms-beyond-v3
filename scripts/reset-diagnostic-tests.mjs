/**
 * Remise à zéro des tests EDGE (aligné sur migration 20261003170000).
 * Usage: node scripts/reset-diagnostic-tests.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const BADGE_ID = "a1000001-0000-4000-8000-000000000001";

async function deleteAll(table, idColumn) {
  const { data, error: selErr } = await db.from(table).select(idColumn).limit(5000);
  if (selErr) {
    if (selErr.message?.includes("does not exist")) return { table, deleted: 0, skipped: true };
    throw new Error(`${table} select: ${selErr.message}`);
  }
  const ids = (data ?? []).map((r) => r[idColumn]).filter(Boolean);
  if (!ids.length) return { table, deleted: 0 };
  const { error } = await db.from(table).delete().in(idColumn, ids);
  if (error) throw new Error(`${table} delete: ${error.message}`);
  return { table, deleted: ids.length };
}

const results = [];
for (const [table, col] of [
  ["soft_skills_resultats", "learner_id"],
  ["soft_skills_resultats_salarie", "learner_id"],
  ["disc_resultats", "profile_id"],
  ["idmc_resultats", "profile_id"],
]) {
  results.push(await deleteAll(table, col));
}

const { error: profErr } = await db
  .from("profiles")
  .update({
    cross_profile_completion: null,
    ai_analysis: null,
    objective_details: null,
    disc_scores: null,
    score_d: null,
    score_i: null,
    score_s: null,
    score_c: null,
  })
  .not("id", "is", null);

if (profErr) {
  const msg = profErr.message ?? "";
  if (!msg.includes("disc_scores") && !msg.includes("score_d")) {
    throw new Error(`profiles update: ${msg}`);
  }
  const { error: profErr2 } = await db
    .from("profiles")
    .update({
      cross_profile_completion: null,
      ai_analysis: null,
      objective_details: null,
    })
    .not("id", "is", null);
  if (profErr2) throw new Error(`profiles update: ${profErr2.message}`);
}

const { data: badgeRow, error: badgeGetErr } = await db
  .from("open_badges")
  .select("id, evaluation_config")
  .eq("id", BADGE_ID)
  .maybeSingle();

if (badgeGetErr) throw new Error(`open_badges read: ${badgeGetErr.message}`);

if (badgeRow?.id) {
  const base =
    badgeRow.evaluation_config && typeof badgeRow.evaluation_config === "object"
      ? { ...badgeRow.evaluation_config }
      : {};
  delete base.learnerAwards;
  delete base.learnerSubmissions;
  delete base.learnerSubmissionsArchive;
  const { error: badgeErr } = await db
    .from("open_badges")
    .update({ evaluation_config: base })
    .eq("id", BADGE_ID);
  if (badgeErr) throw new Error(`open_badges update: ${badgeErr.message}`);
}

console.log(JSON.stringify({ ok: true, tables: results }, null, 2));
