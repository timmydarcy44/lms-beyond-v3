import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getJson(path) {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

console.log(`Project: ${base}\n`);

const tables = [
  "soft_skills_resultats",
  "soft_skills_resultats_salarie",
  "disc_resultats",
  "idmc_resultats",
];

for (const t of tables) {
  const probe = await getJson(`${t}?select=*&limit=0`);
  const countRes = await fetch(`${base}/rest/v1/${t}?select=learner_id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
    },
  });
  console.log(`TABLE ${t}: HTTP ${probe.status}, content-range: ${countRes.headers.get("content-range") ?? "n/a"}`);
  if (probe.status === 404) {
    console.log(`  -> NOT IN SCHEMA: ${JSON.stringify(probe.json?.message ?? probe.json)}\n`);
    continue;
  }
}

const softRows = await getJson(
  "soft_skills_resultats?select=learner_id,total_score,taken_at,scores,ai_analysis&order=taken_at.desc&limit=5",
);
console.log("=== soft_skills_resultats SAMPLE (5 latest) ===");
console.log(JSON.stringify(softRows, null, 2));

const withVariant = await getJson(
  "soft_skills_resultats?select=learner_id,scores&limit=20",
);
if (Array.isArray(withVariant.json)) {
  const variants = withVariant.json
    .map((r) => ({
      learner_id: r.learner_id,
      variant: r.scores?.variant ?? null,
      scoreKeys: r.scores ? Object.keys(r.scores).filter((k) => k !== "variant").length : 0,
    }))
    .filter((r) => r.variant);
  console.log("\n=== Rows with scores.variant in soft_skills_resultats ===");
  console.log(JSON.stringify(variants, null, 2));
}
