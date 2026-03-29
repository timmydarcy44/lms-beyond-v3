/**
 * scripts/parcours-scenarios-e2e.ts
 *
 * NO-TEST / NO-RESOURCE mode
 *
 * Usage:
 *   pnpm tsx scripts/parcours-scenarios-e2e.ts \
 *     <PARCOURS_ID> <LEARNER_ID> <COURSE_ID> \
 *     --baseUrl=http://localhost:3001
 *
 * Env required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

type Args = {
  parcoursId: string;
  learnerId: string;
  courseId: string;
  baseUrl: string;
};

function parseArgs(argv: string[]): Args {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const baseUrlArg = argv.find((a) => a.startsWith("--baseUrl="));
  const baseUrl = baseUrlArg?.split("=", 2)[1] ?? "http://localhost:3001";

  if (positional.length < 3) {
    throw new Error(
      "Missing args. Expected: <PARCOURS_ID> <LEARNER_ID> <COURSE_ID>",
    );
  }

  const [parcoursId, learnerId, courseId] = positional;
  return { parcoursId, learnerId, courseId, baseUrl };
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

async function ensureScenario(
  supabase: ReturnType<typeof createClient>,
  input: {
    parcoursId: string;
    name: string;
    trigger: Record<string, unknown>;
    condition?: Record<string, unknown> | null;
    actions: Array<Record<string, unknown>>;
  },
): Promise<{ scenarioId: string }> {
  // Find by name (idempotent)
  const { data: existing, error: existingErr } = await supabase
    .from("parcours_scenarios")
    .select("id")
    .eq("parcours_id", input.parcoursId)
    .eq("name", input.name)
    .maybeSingle() as { data: { id: string } | null; error: unknown };

  if (existingErr) throw existingErr;

  let scenarioId: string;

  if (existing?.id) {
    scenarioId = existing.id as string;

    // delete steps then recreate
    const { error: delErr } = await supabase
      .from("parcours_scenario_steps")
      .delete()
      .eq("scenario_id", scenarioId);
    if (delErr) throw delErr;
  } else {
    const { data: created, error: createErr } = await (supabase as any)
      .from("parcours_scenarios")
      .insert({
        parcours_id: input.parcoursId,
        name: input.name,
        is_active: true,
      })
      .select("id")
      .single();

    if (createErr || !created?.id) throw createErr ?? new Error("Create failed");
    scenarioId = created.id as string;
  }

  const steps = [
    { step_order: 1, step_type: "trigger", config: input.trigger },
    ...(input.condition
      ? [{ step_order: 2, step_type: "condition", config: input.condition }]
      : []),
    ...input.actions.map((a, idx) => ({
      step_order: (input.condition ? 3 : 2) + idx,
      step_type: "action",
      config: a,
    })),
  ];

  const { error: stepsErr } = await (supabase as any)
    .from("parcours_scenario_steps")
    .insert(
      steps.map((s) => ({
        scenario_id: scenarioId,
        step_order: s.step_order,
        step_type: s.step_type,
        config: s.config,
      })),
    );
  if (stepsErr) throw stepsErr;

  return { scenarioId };
}

async function setupData(supabase: ReturnType<typeof createClient>, args: Args) {
  // course_progress to 100
  await (supabase as any).from("course_progress").upsert(
    {
      course_id: args.courseId,
      user_id: args.learnerId,
      progress_percent: 100,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "course_id,user_id" },
  );

  // path_progress exists (optional but helps assignment checks sometimes)
  await (supabase as any).from("path_progress").upsert(
    {
      path_id: args.parcoursId,
      user_id: args.learnerId,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "path_id,user_id" },
  );
}

async function postEvent(args: Args, body: any) {
  const res = await fetch(`${args.baseUrl}/api/parcours/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `POST /api/parcours/events failed ${res.status}: ${JSON.stringify(json)}`,
    );
  }
  return json;
}

async function verify(supabase: ReturnType<typeof createClient>, args: Args) {
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: runs } = await supabase
    .from("parcours_scenario_runs")
    .select("id, scenario_id, step_id, event_id, executed_at")
    .eq("learner_id", args.learnerId)
    .order("executed_at", { ascending: false })
    .limit(50);

  return { messages: messages ?? [], runs: runs ?? [] };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const supabaseUrl = mustEnv("SUPABASE_URL");
  const serviceKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  console.log("== Parcours Scenarios E2E (NO TEST/RESOURCE) ==");
  console.log("parcoursId:", args.parcoursId);
  console.log("learnerId :", args.learnerId);
  console.log("courseId  :", args.courseId);
  console.log("baseUrl   :", args.baseUrl);

  // 1) Create/refresh scenario: formation_completed -> send_message
  await ensureScenario(supabase, {
    parcoursId: args.parcoursId,
    name: "E2E - Formation terminée -> Message",
    trigger: { type: "formation_completed", formationId: args.courseId },
    actions: [
      {
        type: "send_message",
        message:
          "Bravo 🎉 Tu as terminé une étape du parcours. Tu peux continuer quand tu veux 🙂",
      },
    ],
  });

  console.log("✅ Scénario créé/rafraîchi.");

  // 2) Setup data
  await setupData(supabase, args);
  console.log("✅ Données de test préparées.");

  // 3) Fire event (via API)
  const r1 = await postEvent(args, {
    parcoursId: args.parcoursId,
    learnerId: args.learnerId,
    eventType: "formation_completed",
    payload: { formationId: args.courseId },
  });

  console.log("✅ Event envoyé:", r1);

  // 4) Verify
  const results = await verify(supabase, args);

  console.log("\n== RUNS (last) ==");
  console.table(
    results.runs.slice(0, 15).map((r: any) => ({
      scenario_id: r.scenario_id,
      step_id: r.step_id,
      event_id: r.event_id,
      executed_at: r.executed_at,
    })),
  );

  console.log("\n== MESSAGES (last) ==");
  console.table(
    results.messages.slice(0, 10).map((m: any) => ({
      id: m.id,
      created_at: m.created_at,
      content: String(m.content).slice(0, 80),
    })),
  );

  console.log("\n✅ DONE");
}

main().catch((err) => {
  console.error("❌ E2E script failed:", err);
  process.exit(1);
});

