/**
 * Seed données mock Nutriset pour dashboard entreprise (visuels / démo).
 * Usage: node scripts/seed-nutriset-mock.mjs
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envPath = new URL("../.env.local", import.meta.url);
const env = fs.readFileSync(envPath, "utf8");
const url = env.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const ORG_ID = "163c8e74-b648-4792-9167-2b4031a888b3";
const TIMMY_ID = "00ad40d7-2cd9-4da0-bfb7-c4672f4952f4";

const MOCK_EMPLOYEES = [
  { first_name: "Clara", last_name: "Martin", email: "clara.martin@nutriset-demo.fr", job_title: "RH", department: "Ressources Humaines" },
  { first_name: "Julie", last_name: "Morel", email: "julie.morel@nutriset-demo.fr", job_title: "Formatrice", department: "Formation" },
  { first_name: "Thomas", last_name: "Leroy", email: "thomas.leroy@nutriset-demo.fr", job_title: "Manager", department: "Management" },
  { first_name: "Sarah", last_name: "Petit", email: "sarah.petit@nutriset-demo.fr", job_title: "Marketing", department: "Marketing" },
  { first_name: "Marc", last_name: "Bernard", email: "marc.bernard@nutriset-demo.fr", job_title: "Ingénieur", department: "R&D" },
  { first_name: "Émilie", last_name: "Roux", email: "emilie.roux@nutriset-demo.fr", job_title: "Comptable", department: "Finance" },
  { first_name: "Nicolas", last_name: "Faure", email: "nicolas.faure@nutriset-demo.fr", job_title: "Technicien", department: "Production" },
  { first_name: "Camille", last_name: "Girard", email: "camille.girard@nutriset-demo.fr", job_title: "Designer", department: "Marketing" },
  { first_name: "Antoine", last_name: "Mercier", email: "antoine.mercier@nutriset-demo.fr", job_title: "Commercial", department: "Sales" },
  { first_name: "Laura", last_name: "Bonnet", email: "laura.bonnet@nutriset-demo.fr", job_title: "Assistante RH", department: "Ressources Humaines" },
  { first_name: "Julien", last_name: "Lambert", email: "julien.lambert@nutriset-demo.fr", job_title: "Chef de projet", department: "IT" },
  { first_name: "Sophie", last_name: "Renard", email: "sophie.renard@nutriset-demo.fr", job_title: "Qualité", department: "Production" },
  { first_name: "Hugo", last_name: "Blanc", email: "hugo.blanc@nutriset-demo.fr", job_title: "Data Analyst", department: "IT" },
  { first_name: "Manon", last_name: "Dupuis", email: "manon.dupuis@nutriset-demo.fr", job_title: "Chargée de communication", department: "Marketing" },
  { first_name: "Lucas", last_name: "Fontaine", email: "lucas.fontaine@nutriset-demo.fr", job_title: "Logisticien", department: "Supply Chain" },
  { first_name: "Chloé", last_name: "Chevalier", email: "chloe.chevalier@nutriset-demo.fr", job_title: "Juriste", department: "Legal" },
  { first_name: "Maxime", last_name: "Robin", email: "maxime.robin@nutriset-demo.fr", job_title: "Product Owner", department: "IT" },
  { first_name: "Inès", last_name: "Morin", email: "ines.morin@nutriset-demo.fr", job_title: "UX Designer", department: "IT" },
  { first_name: "Romain", last_name: "Garnier", email: "romain.garnier@nutriset-demo.fr", job_title: "Responsable achats", department: "Supply Chain" },
  { first_name: "Léa", last_name: "Henry", email: "lea.henry@nutriset-demo.fr", job_title: "Contrôleuse de gestion", department: "Finance" },
  { first_name: "Alexandre", last_name: "Masson", email: "alexandre.masson@nutriset-demo.fr", job_title: "Directeur adjoint", department: "Direction" },
];

async function main() {
  // Timmy = admin RH Nutriset (pas simple collaborateur)
  await sb.from("profiles").update({
    role: "entreprise",
    role_type: "admin_hr",
    company_id: ORG_ID,
  }).eq("id", TIMMY_ID);

  const { data: existingMem } = await sb
    .from("org_memberships")
    .select("id")
    .eq("org_id", ORG_ID)
    .eq("user_id", TIMMY_ID)
    .maybeSingle();

  if (!existingMem) {
    await sb.from("org_memberships").insert({
      org_id: ORG_ID,
      user_id: TIMMY_ID,
      role: "admin",
    });
  }

  // demo@entreprise.fr aussi admin RH
  const { data: demoProf } = await sb
    .from("profiles")
    .select("id")
    .eq("email", "demo@entreprise.fr")
    .maybeSingle();
  if (demoProf?.id) {
    await sb.from("profiles").update({
      role: "entreprise",
      role_type: "admin_hr",
      company_id: ORG_ID,
      first_name: "Demo",
      last_name: "Entreprise",
    }).eq("id", demoProf.id);
  }

  // Retirer Timmy de la liste salariés (il est admin RH, pas collaborateur)
  await sb.from("employees").delete().eq("id", "846dba25-0533-4e61-9612-ecc55b45ae52");

  // Équipe principale
  let equipeId;
  const { data: existingEquipe } = await sb
    .from("equipes")
    .select("id")
    .eq("organisation_id", ORG_ID)
    .limit(1)
    .maybeSingle();

  if (existingEquipe?.id) {
    equipeId = existingEquipe.id;
  } else {
    const { data: created } = await sb
      .from("equipes")
      .insert({ organisation_id: ORG_ID, name: "Équipe principale", manager_id: TIMMY_ID })
      .select("id")
      .single();
    equipeId = created.id;
  }

  // Employés mock
  for (const emp of MOCK_EMPLOYEES) {
    const { data: exists } = await sb
      .from("employees")
      .select("id")
      .eq("company_id", ORG_ID)
      .eq("email", emp.email)
      .maybeSingle();
    if (!exists) {
      const { error: insErr } = await sb.from("employees").insert({
        company_id: ORG_ID,
        ...emp,
        status: "active",
      });
      if (insErr) console.warn(`  employé ${emp.email}:`, insErr.message);
    }
  }

  // Agrégat équipe (score 67, maturité structurée)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const { error: aggErr } = await sb.from("equipe_aggregats").insert({
    equipe_id: equipeId,
    organisation_id: ORG_ID,
    periode_debut: weekStart.toISOString().slice(0, 10),
    periode_fin: now.toISOString().slice(0, 10),
    nb_membres_actifs: 24,
    nb_diagnostics_completes: 18,
    idmc_moyen: 67,
    idmc_zone: "attention",
    stress_moyen: 58,
    stress_signal: "modere",
    cohesion_score: 72,
    nb_signaux_attention: 3,
    nb_signaux_critique: 1,
    insight_principal:
      "Organisation structurée — 3 écarts critiques sur l'IA métier et le leadership inter-équipes.",
    gaps_competences: ["IA métier", "Leadership", "Communication client"],
    modules_recommandes: ["Parcours IA Productivité", "Leadership Foundation", "Modern Prospecting"],
    insuffisant: false,
  });
  if (aggErr) console.warn("equipe_aggregats:", aggErr.message);

  // Diagnostics pour profils existants (Jessica, Paul)
  const JESSICA_PROFILE = "3c0b2c22-6049-4c30-83d6-6ba7c41c5e3d";
  const JESSICA_EMP = "c0d5da6c-87bd-45ce-b6f1-a1cf51f23022";
  const PAUL_PROFILE = "4b358a0f-6446-4daf-b792-d6b7677f4394";
  const PAUL_EMP = "67a7f459-0af6-44a2-a9a7-058c502f5a26";

  for (const [collabId, empId, idmc, stress] of [
    [JESSICA_PROFILE, JESSICA_EMP, 71, 62],
    [PAUL_PROFILE, PAUL_EMP, 58, 45],
  ]) {
    await sb.from("collaborateur_diagnostics").upsert(
      {
        collaborateur_id: collabId,
        equipe_id: equipeId,
        organisation_id: ORG_ID,
        employee_id: empId,
        idmc_score: idmc,
        stress_score: stress,
        completed_at: new Date().toISOString(),
        actif: true,
      },
      { onConflict: "collaborateur_id" },
    );
  }

  const { count } = await sb
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("company_id", ORG_ID);

  console.log("✓ Nutriset mock seed terminé");
  console.log(`  Organisation: Nutriset (${ORG_ID})`);
  console.log(`  Admin RH: timmydarcy44@gmail.com + demo@entreprise.fr`);
  console.log(`  Collaborateurs: ${count ?? "?"} total`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
