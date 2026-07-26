import { NextRequest, NextResponse } from "next/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { normalizePersonKey } from "@/lib/jessica-contentin/questionnaires";
import { parseClientName } from "@/lib/jessica-contentin/parse-client-name";
import {
  listJessicaQuestionnairesFromDb,
  seedBuiltinJessicaQuestionnaires,
} from "@/lib/queries/jessica-questionnaires";

type SeedRow = {
  questionnaire_slug: string;
  external_id: string;
  respondent_email: string | null;
  respondent_first_name: string | null;
  respondent_last_name: string | null;
  respondent_phone: string | null;
  child_first_name: string | null;
  child_last_name: string | null;
  answers: Record<string, unknown>;
  score: number | null;
  score_label: string | null;
  submitted_at: string | null;
  source: string;
};

async function loadSeed(): Promise<SeedRow[]> {
  const mod = await import(
    "@/lib/jessica-contentin/questionnaires/seed-responses.generated.json"
  );
  return (mod.default ?? mod) as SeedRow[];
}

export async function POST(_req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponible" }, { status: 500 });

  const seedDefs = await seedBuiltinJessicaQuestionnaires(user.id);
  if (seedDefs.error) {
    return NextResponse.json(
      {
        error:
          seedDefs.error.includes("does not exist") || seedDefs.error.includes("schema cache")
            ? "Table questionnaires absente. Exécutez d’abord la migration SQL (sans FK cabinet)."
            : seedDefs.error,
      },
      { status: 500 },
    );
  }

  const defs = await listJessicaQuestionnairesFromDb({ includeInactive: true });
  const idBySlug = new Map(defs.map((d) => [d.slug, d.id]));

  const seed = await loadSeed();

  const patientsRes = await supabase
    .from("jessica_cabinet_patients")
    .select("id, email, first_name, last_name, profile_id");
  const patients = patientsRes.error ? [] : (patientsRes.data ?? []);

  const profilesRes = await supabase.from("profiles").select("id, email, full_name");
  const profiles = profilesRes.error ? [] : (profilesRes.data ?? []);

  const byEmail = new Map<string, { patientId?: string; profileId?: string }>();
  for (const p of patients) {
    const e = (p.email as string | null)?.toLowerCase();
    if (!e) continue;
    byEmail.set(e, {
      patientId: p.id as string,
      profileId: (p.profile_id as string | null) ?? undefined,
    });
  }
  for (const p of profiles) {
    const e = (p.email as string | null)?.toLowerCase();
    if (!e) continue;
    const prev = byEmail.get(e) ?? {};
    byEmail.set(e, { ...prev, profileId: p.id as string });
  }

  const byChild = new Map<string, { patientId?: string; profileId?: string }>();
  for (const p of patients) {
    const key = `${normalizePersonKey(p.last_name as string)}|${normalizePersonKey(p.first_name as string)}`;
    if (key === "|") continue;
    byChild.set(key, {
      patientId: p.id as string,
      profileId: (p.profile_id as string | null) ?? undefined,
    });
  }
  for (const p of profiles) {
    const { firstName, lastName } = parseClientName((p.full_name as string | null) ?? null);
    const key = `${normalizePersonKey(lastName)}|${normalizePersonKey(firstName)}`;
    if (key === "|") continue;
    const prev = byChild.get(key) ?? {};
    byChild.set(key, { ...prev, profileId: p.id as string });
  }

  let upserted = 0;
  let linked = 0;
  const chunkSize = 50;

  for (let i = 0; i < seed.length; i += chunkSize) {
    const chunk = seed.slice(i, i + chunkSize).map((row) => {
      let cabinet_patient_id: string | null = null;
      let profile_id: string | null = null;

      const email = row.respondent_email?.toLowerCase() || null;
      if (email && byEmail.has(email)) {
        const m = byEmail.get(email)!;
        cabinet_patient_id = m.patientId ?? null;
        profile_id = m.profileId ?? null;
      }

      const childKey = `${normalizePersonKey(row.child_last_name)}|${normalizePersonKey(row.child_first_name)}`;
      if ((!cabinet_patient_id || !profile_id) && childKey !== "|" && byChild.has(childKey)) {
        const m = byChild.get(childKey)!;
        cabinet_patient_id = cabinet_patient_id ?? m.patientId ?? null;
        profile_id = profile_id ?? m.profileId ?? null;
      }

      const respKey = `${normalizePersonKey(row.respondent_last_name)}|${normalizePersonKey(row.respondent_first_name)}`;
      if ((!cabinet_patient_id || !profile_id) && respKey !== "|" && byChild.has(respKey)) {
        const m = byChild.get(respKey)!;
        cabinet_patient_id = cabinet_patient_id ?? m.patientId ?? null;
        profile_id = profile_id ?? m.profileId ?? null;
      }

      if (cabinet_patient_id || profile_id) linked++;

      return {
        questionnaire_slug: row.questionnaire_slug,
        questionnaire_id: idBySlug.get(row.questionnaire_slug) ?? null,
        external_id: row.external_id,
        respondent_email: row.respondent_email,
        respondent_first_name: row.respondent_first_name,
        respondent_last_name: row.respondent_last_name,
        respondent_phone: row.respondent_phone,
        child_first_name: row.child_first_name,
        child_last_name: row.child_last_name,
        cabinet_patient_id,
        profile_id,
        answers: row.answers,
        score: row.score,
        score_label: row.score_label,
        submitted_at: row.submitted_at,
        source: row.source || "typeform_import",
        created_by: user.id,
      };
    });

    const { error, count } = await supabase
      .from("jessica_questionnaire_responses")
      .upsert(chunk, { onConflict: "external_id", count: "exact" });

    if (error) {
      console.error("[jessica-questionnaires/import]", error);
      return NextResponse.json({ error: error.message, upserted }, { status: 500 });
    }
    upserted += count ?? chunk.length;
  }

  return NextResponse.json({
    ok: true,
    total: seed.length,
    upserted,
    defsSeeded: seedDefs.seeded,
    linkedApprox: linked,
  });
}
