/**
 * Harmonisation pré-audit restante (DB) — sans toucher aux preuves.
 *
 *   pnpm exec tsx scripts/apply-qualiopi-preaudit-remaining.ts
 */
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { assessQualiopiFicheCompliance } from "../src/lib/training-courses/qualiopi-fiche";
import { QUALIOPI_PUBLIC_CONTACT_EMAIL } from "../src/lib/qualiopi/public-copy";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

const ISSUE_PREFIX_RE = /^à l['’]issue de (cette |la )?formation[,:\s]*/i;
const CAPABLE_PREFIX_RE =
  /^(le |la |l['’])?(participant(e)?|stagiaire) sera capable de\s*/i;

function cleanObjective(raw: string): string {
  let o = String(raw ?? "").trim();
  o = o.replace(ISSUE_PREFIX_RE, "").replace(CAPABLE_PREFIX_RE, "").trim();
  if (o && o[0] === o[0].toLowerCase()) {
    o = o.charAt(0).toUpperCase() + o.slice(1);
  }
  return o;
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // --- A2 flag OF ---
  const { error: colErr } = await sb.rpc("exec_sql" as never).maybeSingle?.();
  void colErr;
  // Apply column via raw SQL if possible; otherwise update after manual migration.
  const { error: alterErr } = await sb
    .from("of_settings")
    .update({ qualiopi_certified: false })
    .eq("id", 1);
  if (alterErr && /qualiopi_certified|column/i.test(alterErr.message)) {
    console.warn(
      "⚠ Colonne qualiopi_certified absente — appliquer la migration SQL puis relancer.",
      alterErr.message,
    );
  } else if (alterErr) {
    // try without id filter
    const { data: ofRows } = await sb.from("of_settings").select("id").limit(1);
    const ofId = ofRows?.[0]?.id;
    if (ofId) {
      const { error: e2 } = await sb
        .from("of_settings")
        .update({ qualiopi_certified: false })
        .eq("id", ofId);
      console.log("of_settings qualiopi_certified", e2?.message || "false (défaut)");
    }
  } else {
    console.log("of_settings.qualiopi_certified = false");
  }

  // --- B objectifs ---
  const { data: courses, error: cErr } = await sb
    .from("training_courses")
    .select(
      "id, slug, title, objectives, is_active, recognition_type, recognition_detail, pedagogical_modality, pedagogical_modality_detail, financing_modalities, duration, price_on_quote, intra_price, inter_price",
    )
    .eq("is_active", true);
  if (cErr) throw cErr;

  let objUpdated = 0;
  const violations: Array<{ slug: string; title: string; missing: string[] }> = [];
  for (const c of courses ?? []) {
    const objs = Array.isArray(c.objectives) ? c.objectives.map(String) : [];
    const cleaned = objs.map(cleanObjective).filter(Boolean);
    const changed =
      cleaned.length !== objs.length || cleaned.some((v, i) => v !== objs[i]);
    if (changed) {
      const { error } = await sb
        .from("training_courses")
        .update({ objectives: cleaned, updated_at: new Date().toISOString() })
        .eq("id", c.id);
      if (error) console.error("objectives", c.slug, error.message);
      else objUpdated += 1;
    }
    const compliance = assessQualiopiFicheCompliance({
      objectives: cleaned,
      recognition_type: c.recognition_type,
      recognition_detail: c.recognition_detail,
      pedagogical_modality: c.pedagogical_modality,
      pedagogical_modality_detail: c.pedagogical_modality_detail,
      financing_modalities: c.financing_modalities,
      duration: c.duration,
      price_on_quote: c.price_on_quote,
      intra_price: c.intra_price,
      inter_price: c.inter_price,
    });
    if (!compliance.ok) {
      violations.push({
        slug: String(c.slug),
        title: String(c.title),
        missing: compliance.missing,
      });
    }
  }
  console.log(`Objectifs nettoyés : ${objUpdated} fiche(s) active(s)`);
  console.log(`Fiches actives NON Qualiopi OK : ${violations.length}`);
  for (const v of violations.slice(0, 40)) {
    console.log(`  - ${v.slug} | ${v.title} | ${v.missing.join("; ")}`);
  }

  // --- E procédures (contenu, sans valider — repasse en draft) ---
  const procedurePatches: Array<{
    slug: string;
    key: string;
    content: string;
  }> = [
    {
      slug: "reclamations",
      key: "deroulement",
      content: `## Canaux
- Formulaire de réclamation dans les espaces apprenant et entreprise, enregistré automatiquement dans le registre Qualité
- E-mail : ${QUALIOPI_PUBLIC_CONTACT_EMAIL}

## Étapes
1. Accusé de réception sous 2 jours ouvrés
2. Instruction et qualification (thème, gravité)
3. Réponse écrite sous 10 jours ouvrés
4. Clôture documentée dans le registre

## Suivi
Toute réclamation reste traçable jusqu’à clôture ; synthèse présentée en comité qualité.`,
    },
    {
      slug: "paq",
      key: "suivi_preuves",
      content: `Byound Control → Qualité → Plan d’amélioration (export PDF).
Comptes rendus de comité et actions datées, responsables et échéances.`,
    },
    {
      slug: "handicap",
      key: "responsabilites",
      content: `## Référent handicap
Jessica Contentin — ${QUALIOPI_PUBLIC_CONTACT_EMAIL}

## Périmètre
Étude personnalisée de chaque situation, orientation partenaires (Agefiph, Cap emploi) si besoin.`,
    },
  ];

  for (const p of procedurePatches) {
    const { data: proc } = await sb
      .from("crm_qualiopi_procedures")
      .select("id, status, current_version, effective_date")
      .eq("slug", p.slug)
      .maybeSingle();
    if (!proc) {
      console.warn("proc missing", p.slug);
      continue;
    }
    const { error: secErr } = await sb
      .from("crm_qualiopi_procedure_sections")
      .update({ content: p.content, updated_at: new Date().toISOString() })
      .eq("procedure_id", proc.id)
      .eq("key", p.key);
    if (secErr) {
      console.error(p.slug, p.key, secErr.message);
      continue;
    }
    // Contenu modifié → brouillon (Jessica revalide dans l’UI). Ne pas valider ici.
    if (proc.status === "validated") {
      const { error: stErr } = await sb
        .from("crm_qualiopi_procedures")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proc.id);
      console.log(
        `✓ ${p.slug}.${p.key} mis à jour → status draft (était ${proc.status})`,
        stErr?.message || "",
      );
    } else {
      console.log(`✓ ${p.slug}.${p.key} mis à jour (status ${proc.status})`);
    }
  }

  // --- G badges doublons (liste seule) ---
  const { data: badges } = await sb
    .from("open_badge_classes")
    .select("id, name, slug, created_at")
    .order("name")
    .limit(2000);
  const byName = new Map<string, Array<{ id: string; name: string; slug: string }>>();
  for (const b of badges ?? []) {
    const key = String(b.name ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    if (!key) continue;
    const list = byName.get(key) ?? [];
    list.push({ id: String(b.id), name: String(b.name), slug: String(b.slug ?? "") });
    byName.set(key, list);
  }
  const dupes = [...byName.entries()].filter(([, v]) => v.length > 1);
  console.log(`\nBadges doublons (nom) : ${dupes.length} groupe(s)`);
  for (const [key, list] of dupes) {
    if (
      /neuroeducation|neuroéducation|modern prospecting|fondamentaux/i.test(key) ||
      true
    ) {
      console.log(`  « ${list[0]?.name} » × ${list.length}`);
      for (const item of list) console.log(`    - ${item.id} · ${item.slug}`);
    }
  }

  // --- G pipeline en retard (liste seule) ---
  const today = new Date().toISOString().slice(0, 10);
  const { data: lateDeals } = await sb
    .from("crm_pipeline_deals")
    .select("id, title, company_name, stage, next_action_date, status")
    .lt("next_action_date", today)
    .not("next_action_date", "is", null)
    .order("next_action_date", { ascending: true })
    .limit(80);
  const testLate = (lateDeals ?? []).filter((d) => {
    const blob = `${d.title} ${d.company_name} ${d.stage}`.toLowerCase();
    return /test|demo|démo|printngo|timmy|\+test/i.test(blob);
  });
  console.log(`\nPipeline — dossiers next_action passée : ${lateDeals?.length ?? 0}`);
  console.log(`Dont suspects test/démo : ${testLate.length}`);
  for (const d of (testLate.length ? testLate : lateDeals ?? []).slice(0, 30)) {
    console.log(
      `  - [${d.next_action_date}] ${d.company_name || "—"} · ${d.title} · ${d.stage} · ${d.status}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
