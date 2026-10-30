import { createClient } from "@supabase/supabase-js";
import { issueBadgeAssertion } from "@/lib/openbadges/badge-assertions";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Supabase service role manquant.");
  process.exit(1);
}

const db = createClient(url, key);

async function main() {
  const { data: badges, error } = await db.from("open_badges").select("id, name, evaluation_config");
  if (error) throw new Error(error.message);

  let created = 0;
  let existing = 0;
  let signed = 0;
  let skipped = 0;

  for (const badge of badges ?? []) {
    const config = badge.evaluation_config;
    const awards =
      config && typeof config === "object" && !Array.isArray(config)
        ? (config as { learnerAwards?: Record<string, { awardedAt?: string }> }).learnerAwards
        : undefined;
    if (!awards) continue;

    for (const [profileId, award] of Object.entries(awards)) {
      const { data: care } = await db
        .from("care_profiles")
        .select("published")
        .eq("expert_id", profileId)
        .maybeSingle();
      const isPublic = care?.published === true;
      const result = await issueBadgeAssertion(db, {
        badgeClassId: String(badge.id),
        recipientProfileId: profileId,
        issuedAt: award?.awardedAt,
        isPublic,
      });
      if (!result.ok) {
        skipped += 1;
        console.log(`ignoré ${badge.name ?? badge.id} ${profileId.slice(0, 8)} ${result.error}`);
        continue;
      }
      if (result.alreadyExisted) existing += 1;
      else created += 1;
      if (result.signed) signed += 1;
      console.log(
        `${result.alreadyExisted ? "déjà" : "créé"} ${badge.name ?? badge.id} public=${isPublic} signé=${result.signed}`,
      );
    }
  }

  console.log(JSON.stringify({ created, existing, signed, skipped }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
