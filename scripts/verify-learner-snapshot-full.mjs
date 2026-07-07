/** Full learner snapshot simulation for one email. */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { collectLearnerProfileCandidates, fetchDiscScoresForCandidates, fetchIdmcAxesForCandidates, fetchSoftSkillsRadarForCandidates } from "../src/lib/learner/resolve-learner-profile-candidates.ts";

dotenv.config({ path: ".env.local" });

const emailArg = (process.argv[2] ?? "timmydarcy44+test2026@gmail.com").trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) process.exit(1);

const service = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: authList } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = authList.users.find((u) => u.email?.toLowerCase() === emailArg);
  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  const profileIds = await collectLearnerProfileCandidates(service, user.id, emailArg);
  const [disc, idmc, soft] = await Promise.all([
    fetchDiscScoresForCandidates(service, profileIds),
    fetchIdmcAxesForCandidates(service, profileIds),
    fetchSoftSkillsRadarForCandidates(service, profileIds),
  ]);

  const { data: employee } = await service
    .from("employees")
    .select("id, first_name, last_name, email, company_id, profile_id")
    .or(`profile_id.eq.${user.id},email.eq.${emailArg}`)
    .order("created_at", { ascending: false })
    .limit(5);

  console.log(JSON.stringify({
    email: emailArg,
    userId: user.id,
    profileIds,
    disc: disc ? { D: disc.D, I: disc.I } : null,
    idmcAxes: idmc,
    softSkillsCount: soft?.length ?? 0,
    softSkillsSample: soft?.slice(0, 3),
    employees: employee,
  }, null, 2));
}

main();
