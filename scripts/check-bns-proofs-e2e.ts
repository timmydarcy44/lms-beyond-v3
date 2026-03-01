import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const logResult = (label: string, ok: boolean, details?: string) => {
  const status = ok ? "OK" : "FAIL";
  console.log(`[${status}] ${label}${details ? ` — ${details}` : ""}`);
};

const randomEmail = (prefix: string) =>
  `${prefix}.${Date.now()}@example.local`;

const main = async () => {
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE URL or SERVICE ROLE KEY.");
    process.exit(1);
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const password = "Test1234!";
  const adminEmail = randomEmail("bns-admin");
  const userEmail = randomEmail("bns-user");

  const { data: adminUser, error: adminError } = await service.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
  });
  logResult("Create admin user", !adminError && !!adminUser.user);

  const { data: userData, error: userError } = await service.auth.admin.createUser({
    email: userEmail,
    password,
    email_confirm: true,
  });
  logResult("Create normal user", !userError && !!userData.user);

  if (!adminUser.user || !userData.user) {
    process.exit(1);
  }

  await service.from("profiles").upsert([
    { id: adminUser.user.id, email: adminEmail, role: "admin" },
    { id: userData.user.id, email: userEmail, role: "learner" },
  ]);

  const proofSlug = `preuve-${Date.now()}`;
  const { data: proof, error: proofError } = await service
    .from("bns_proofs")
    .insert({
      slug: proofSlug,
      title: "Preuve test",
      description: "Preuve pour test E2E",
      created_by: adminUser.user.id,
    })
    .select("id")
    .maybeSingle();

  logResult("Create proof", !proofError && !!proof?.id);
  if (!proof?.id) process.exit(1);

  const { data: step } = await service
    .from("bns_proof_steps")
    .insert({
      proof_id: proof.id,
      title: "Étape 1",
      description: "Contenu",
      step_order: 0,
    })
    .select("id")
    .maybeSingle();

  await service.from("bns_proof_nodes").insert({
    proof_step_id: step?.id,
    title: "Module 1",
    description: "Intro",
    content_type: "module",
    content_id: null,
    node_order: 0,
  });

  const snapshot = {
    proofId: proof.id,
    proofTitle: "Preuve test",
    generatedAt: new Date().toISOString(),
    steps: [
      {
        id: step?.id,
        title: "Étape 1",
        description: "Contenu",
        order: 0,
        contents: [
          {
            id: "node-1",
            title: "Module 1",
            description: "Intro",
            content_type: "module",
            content_id: null,
          },
        ],
      },
    ],
  };

  const { data: version } = await service
    .from("bns_proof_plan_versions")
    .insert({
      proof_id: proof.id,
      version_number: 1,
      snapshot,
      published_by: adminUser.user.id,
    })
    .select("id")
    .maybeSingle();

  await service
    .from("bns_proofs")
    .update({ is_published: true, latest_plan_version_id: version?.id })
    .eq("id", proof.id);

  if (anonKey) {
    const anon = createClient(supabaseUrl, anonKey);
    const { data: publicProofs, error: publicError } = await anon
      .from("bns_proofs")
      .select("id, slug")
      .eq("slug", proofSlug);
    logResult("Public proof visible", !publicError && (publicProofs?.length ?? 0) > 0);
  } else {
    logResult("Public proof visible", false, "Missing anon key, skipped");
  }

  if (!anonKey) {
    process.exit(0);
  }

  const userClient = createClient(supabaseUrl, anonKey);
  await userClient.auth.signInWithPassword({ email: userEmail, password });

  const { data: enrollment, error: enrollError } = await userClient
    .from("bns_user_proof_enrollments")
    .insert({
      user_id: userData.user.id,
      proof_id: proof.id,
      plan_version_id: version?.id,
    })
    .select("id")
    .maybeSingle();
  logResult("Enroll creates row", !enrollError && !!enrollment?.id);

  const { error: artifactError } = await userClient.from("bns_user_proof_artifacts").insert({
    enrollment_id: enrollment?.id,
    user_id: userData.user.id,
    title: "Livrable test",
    url: "https://example.com/livrable",
    artifact_type: "link",
  });
  logResult("Artifacts insert ok for owner", !artifactError);

  const otherClient = createClient(supabaseUrl, anonKey);
  await otherClient.auth.signInWithPassword({ email: adminEmail, password });
  const { error: forbiddenError } = await otherClient.from("bns_user_proof_artifacts").insert({
    enrollment_id: enrollment?.id,
    user_id: adminUser.user.id,
    title: "Hack",
    url: "https://example.com/hack",
    artifact_type: "link",
  });
  logResult("Forbidden for other user", !!forbiddenError);

  const { data: adminView, error: adminViewError } = await otherClient
    .from("bns_user_proof_enrollments")
    .select("id")
    .eq("proof_id", proof.id);
  logResult("Admin can see enrollments", !adminViewError && (adminView?.length ?? 0) > 0);
};

main().catch((error) => {
  console.error("E2E script failed:", error);
  process.exit(1);
});

