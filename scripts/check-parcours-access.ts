/**
 * scripts/check-parcours-access.ts
 *
 * Usage:
 *   pnpm tsx scripts/check-parcours-access.ts <PARCOURS_ID> <USER_ID> [--baseUrl=http://localhost:3001] [--probePathsColumns]
 *
 * Env required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * What it checks:
 *  - paths: owner_id / creator_id
 *  - assignment signals: content_assignments / group_members / path_progress
 *  - can read scenarios?
 *  - service-role write test (scenario + steps)
 *  - optional HTTP GET on API route (unauthenticated probe)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Args = {
  parcoursId: string;
  userId: string;
  baseUrl?: string;
  probePathsColumns: boolean;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function parseArgs(argv: string[]): Args {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const baseUrlArg = argv.find((a) => a.startsWith("--baseUrl="));
  const baseUrl = baseUrlArg?.split("=", 2)[1];
  const probePathsColumns = argv.includes("--probePathsColumns");

  if (positional.length < 2) {
    throw new Error("Expected args: <PARCOURS_ID> <USER_ID> [--baseUrl=...]");
  }

  const [parcoursId, userId] = positional;
  return { parcoursId, userId, baseUrl, probePathsColumns };
}

function logTitle(title: string) {
  console.log(`\n== ${title} ==`);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function gracefulExit(code: number) {
  process.exitCode = code;
  await sleep(10);
  setTimeout(() => process.exit(code), 50);
}

async function tryFetchPathColumn(
  supabase: SupabaseClient,
  parcoursId: string,
  column: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("paths")
      .select(column)
      .eq("id", parcoursId)
      .maybeSingle();

    if (error) return null;
    const value = data?.[column as keyof typeof data] as unknown;
    return typeof value === "string" && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const supabaseUrl = mustEnv("SUPABASE_URL");
  const serviceKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  console.log("🔎 check-parcours-access");
  console.log("parcoursId:", args.parcoursId);
  console.log("userId   :", args.userId);
  if (args.baseUrl) console.log("baseUrl  :", args.baseUrl);

  if (args.probePathsColumns) {
    logTitle("probe paths columns (--probePathsColumns)");
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/paths?select=*&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        console.warn(
          "⚠️ probe request failed:",
          `${response.status} ${response.statusText}`,
        );
      } else {
        const json = (await response.json()) as Array<Record<string, unknown>>;
        if (json.length === 0) {
          console.log("No rows returned. paths table may be empty.");
        } else {
          console.log("Columns detected:", Object.keys(json[0]));
        }
      }
    } catch (error) {
      console.warn("⚠️ probe request threw:", String(error));
    }
  }

  // 1) Path ownership
  logTitle("paths ownership");
  const { data: path, error: pathErr } = await supabase
    .from("paths")
    .select("id, owner_id, creator_id")
    .eq("id", args.parcoursId)
    .maybeSingle();

  if (pathErr) throw pathErr;
  if (!path) {
    console.error("❌ Path not found:", args.parcoursId);
    await gracefulExit(1);
    return;
  }

  const ownerId = path.owner_id ?? null;
  const creatorId = path.creator_id ?? null;

  let displayTitle: string | null = null;
  const titleCandidates = ["title", "label", "name"];
  for (const column of titleCandidates) {
    displayTitle = await tryFetchPathColumn(supabase, args.parcoursId, column);
    if (displayTitle) break;
  }

  const isOwner = ownerId === args.userId;
  const isCreator = creatorId === args.userId;
  const isOwnerOrCreator = isOwner || isCreator;

  console.log({
    owner_id: ownerId ?? null,
    creator_id: creatorId ?? null,
    callerId: args.userId,
    isOwner,
    isCreator,
    isOwnerOrCreator,
    displayTitle: displayTitle ?? "(no title)",
  });

  console.table([
    {
      id: path.id,
      title: displayTitle ?? "(no title)",
      owner_id: ownerId,
      creator_id: creatorId,
      is_owner: isOwner,
      is_creator: isCreator,
      is_owner_or_creator: isOwnerOrCreator,
    },
  ]);

  // 2) Assignment signals
  logTitle("assignment checks (content_assignments / groups / path_progress)");

  const { data: directAssign, error: directErr } = await supabase
    .from("content_assignments")
    .select("id, created_at")
    .eq("content_type", "path")
    .eq("content_id", args.parcoursId)
    .eq("learner_id", args.userId)
    .maybeSingle();

  if (directErr) {
    console.warn("⚠️ direct assignment lookup error:", directErr.message);
  }

  const { data: groupAssigns, error: groupErr } = await supabase
    .from("content_assignments")
    .select("group_id")
    .eq("content_type", "path")
    .eq("content_id", args.parcoursId)
    .not("group_id", "is", null);

  if (groupErr) {
    console.warn("⚠️ group assignments lookup error:", groupErr.message);
  }

  const groupIds =
    (groupAssigns ?? [])
      .map((g) => g.group_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0) ?? [];

  let isMemberOfAssignedGroup = false;
  if (groupIds.length) {
    const { data: membership, error: membershipErr } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", args.userId)
      .in("group_id", groupIds)
      .limit(1)
      .maybeSingle();

    if (membershipErr) {
      console.warn("⚠️ group membership lookup error:", membershipErr.message);
    } else {
      isMemberOfAssignedGroup = Boolean(membership);
    }
  }

  const { data: pathProgress, error: pathProgressErr } = await supabase
    .from("path_progress")
    .select("id, last_accessed_at, updated_at")
    .eq("path_id", args.parcoursId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (pathProgressErr) {
    console.warn("⚠️ path_progress lookup error:", pathProgressErr.message);
  }

  console.table([
    {
      direct_assignment: Boolean(directAssign),
      group_ids_count: groupIds.length,
      member_of_assigned_group: isMemberOfAssignedGroup,
      has_path_progress: Boolean(pathProgress),
      last_accessed_at: pathProgress?.last_accessed_at ?? null,
      updated_at: pathProgress?.updated_at ?? null,
      considered_assigned:
        Boolean(directAssign) || isMemberOfAssignedGroup || Boolean(pathProgress),
    },
  ]);

  // 3) scenarios read
  logTitle("scenarios read (service role)");
  const { data: scenarios, error: scenariosErr } = await supabase
    .from("parcours_scenarios")
    .select("id, name, is_active, created_at")
    .eq("parcours_id", args.parcoursId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (scenariosErr) {
    console.warn("⚠️ scenarios read error:", scenariosErr.message);
  } else {
    console.log(`Found ${scenarios?.length ?? 0} scenario(s).`);
    if (scenarios?.length) console.table(scenarios);
  }

  // 4) service role write test
  logTitle("write test (service role): insert scenario + steps");
  const testScenarioName = `ACCESS-CHECK ${new Date().toISOString()}`;

  const { data: insertedScenario, error: insertScenarioErr } = await supabase
    .from("parcours_scenarios")
    .insert({
      parcours_id: args.parcoursId,
      name: testScenarioName,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertScenarioErr || !insertedScenario?.id) {
    const message = insertScenarioErr?.message ?? String(insertScenarioErr);
    if (message.includes("Could not find the table") || message.includes("does not exist")) {
      console.warn("ℹ️ parcours_scenarios table missing in this schema. Skipping write test.");
    } else {
      console.error("❌ Failed to insert parcours_scenarios:", message);
      await gracefulExit(1);
      return;
    }
  }

  if (!insertedScenario?.id) {
    logTitle("write test skipped");
    console.log("Skipping service-role write test because parcours_scenarios table is absent.");
    return;
  }

  const scenarioId = insertedScenario.id as string;

  const steps = [
    { step_order: 1, step_type: "trigger", config: { type: "formation_completed" } },
    {
      step_order: 2,
      step_type: "action",
      config: { type: "send_message", message: "Hello from access check" },
    },
  ];

  const { error: insertStepsErr } = await supabase.from("parcours_scenario_steps").insert(
    steps.map((step) => ({
      scenario_id: scenarioId,
      step_order: step.step_order,
      step_type: step.step_type,
      config: step.config,
    })),
  );

  if (insertStepsErr) {
    const message = insertStepsErr.message;
    if (message.includes("Could not find the table") || message.includes("does not exist")) {
      console.warn(
        "ℹ️ parcours_scenario_steps table missing in this schema. Skipping write test.",
      );
      await supabase.from("parcours_scenarios").delete().eq("id", scenarioId);
      return;
    }
    console.error("❌ Failed to insert parcours_scenario_steps:", message);
    await supabase.from("parcours_scenarios").delete().eq("id", scenarioId);
    await gracefulExit(1);
    return;
  }

  console.log("✅ Insert OK:", { scenarioId });

  await supabase.from("parcours_scenarios").delete().eq("id", scenarioId);
  console.log("🧹 Cleanup OK (scenario removed).");

  // 5) Optional HTTP check
  if (args.baseUrl) {
    logTitle("optional HTTP check (likely 401/403 unauthenticated)");
    try {
      const res = await fetch(
        `${args.baseUrl}/api/parcours/${args.parcoursId}/scenarios`,
        { method: "GET" },
      );
      const text = await res.text();
      console.log("GET /api/parcours/[id]/scenarios status:", res.status);
      console.log("Body (first 300 chars):", text.slice(0, 300));
      console.log(
        "ℹ️ 401/403 is expected here because the call is unauthenticated from this script.",
      );
    } catch (error) {
      console.warn("⚠️ HTTP check failed:", String(error));
    }
  }

  logTitle("Summary");
  console.log(
    "ℹ️ RLS simulation côté utilisateur non exécutée (nécessite une session authentifiée).",
  );
  console.log("✅ DB access check finished (service role write succeeded).");
  if (isOwnerOrCreator) {
    console.log("✅ User is owner/creator.");
  } else {
    console.log("ℹ️ User is NOT owner/creator.");
  }

  console.log("\nHow to run:");
  console.log(
    "  pnpm tsx scripts/check-parcours-access.ts <PARCOURS_ID> <USER_ID> --baseUrl=http://localhost:3001",
  );
  console.log(
    "  pnpm tsx scripts/check-parcours-access.ts <PARCOURS_ID> <USER_ID> --probePathsColumns",
  );
}

main().catch((error) => {
  console.error("❌ check failed:", error);
  gracefulExit(1).catch(() => {
    process.exit(1);
  });
});

