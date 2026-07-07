/** Simule learner-snapshot pour un email salarié. Usage: node scripts/verify-learner-snapshot.mjs [email] */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailArg = (process.argv[2] ?? "timmydarcy44+test2026@gmail.com").trim().toLowerCase();

if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const service = createClient(url, key, { auth: { persistSession: false } });

async function collectLearnerProfileCandidates(userId, email) {
  const ids = new Set();
  if (userId?.trim()) ids.add(userId.trim());
  const normalizedEmail = (email ?? "").trim().toLowerCase();

  const [{ data: profileById }, { data: profileByEmail }, { data: employeeRow }] = await Promise.all([
    service.from("profiles").select("id, email").eq("id", userId).maybeSingle(),
    normalizedEmail
      ? service.from("profiles").select("id").eq("email", normalizedEmail).maybeSingle()
      : Promise.resolve({ data: null }),
    normalizedEmail
      ? service
          .from("employees")
          .select("profile_id")
          .or(`profile_id.eq.${userId},email.eq.${normalizedEmail}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : service
          .from("employees")
          .select("profile_id")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
  ]);

  if (profileById?.id) ids.add(String(profileById.id));
  if (profileByEmail?.id) ids.add(String(profileByEmail.id));

  const profileEmail = String(profileById?.email ?? normalizedEmail).trim().toLowerCase();
  if (profileEmail) {
    const { data: siblings } = await service.from("profiles").select("id").eq("email", profileEmail);
    for (const row of siblings ?? []) {
      if (row?.id) ids.add(String(row.id));
    }
  }

  if (employeeRow?.profile_id) ids.add(String(employeeRow.profile_id));
  return Array.from(ids);
}

async function fetchDiscLoop(profileIds) {
  let best = null;
  let bestTime = 0;
  for (const profileId of profileIds) {
    const { data, error } = await service
      .from("disc_resultats")
      .select("scores, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error) continue;
    if (!data?.scores) continue;
    const t = Date.parse(String(data.updated_at ?? "")) || 0;
    if (!best || t >= bestTime) {
      best = data.scores;
      bestTime = t;
    }
  }
  return best;
}

async function main() {
  const { data: authList } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = authList.users.find((u) => u.email?.toLowerCase() === emailArg);
  if (!user) {
    console.error("User not found:", emailArg);
    process.exit(1);
  }

  const profileIds = await collectLearnerProfileCandidates(user.id, emailArg);
  const [{ data: profiles }, { data: employee }, discScores] = await Promise.all([
    profileIds.length
      ? service.from("profiles").select("id, first_name, last_name, email").in("id", profileIds)
      : Promise.resolve({ data: [] }),
    service
      .from("employees")
      .select("first_name, last_name, job_title")
      .or(`profile_id.eq.${user.id},email.eq.${emailArg}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchDiscLoop(profileIds),
  ]);

  const profileRow =
    profiles?.find((p) => p.id === user.id) ??
    profiles?.find((p) => String(p.first_name ?? "").trim()) ??
    profiles?.[0] ??
    null;

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: emailArg,
        userId: user.id,
        profileIds,
        firstName: profileRow?.first_name ?? employee?.first_name ?? null,
        employeeFirstName: employee?.first_name ?? null,
        hasDisc: Boolean(discScores),
        discPreview: discScores ? { D: discScores.D, I: discScores.I } : null,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
