/**
 * Harmonisation catalogue Qualiopi (financement + fiche 3 h IA).
 *
 *   pnpm exec tsx scripts/apply-qualiopi-harmonisation-catalog.ts
 */
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  QUALIOPI_ELEARNING_3H_METHODS,
  QUALIOPI_ELEARNING_3H_MODALITY,
  QUALIOPI_FINANCING_COPY,
  QUALIOPI_PUBLIC_CONTACT_EMAIL,
  QUALIOPI_PUBLIC_CONTACT_LINE,
  QUALIOPI_HANDICAP_REFERENT_LINE,
} from "../src/lib/qualiopi/public-copy";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env manquant");
  const sb = createClient(url, key);

  // 1) Financement canonique sur toutes les fiches actives
  const { data: courses, error } = await sb
    .from("training_courses")
    .select(
      "id, slug, title, financing_modalities, pedagogical_modality, pedagogical_modality_detail, methodology, objectives, prerequisites, contact_referent, handicap_referent, duration, formats",
    )
    .eq("is_active", true);
  if (error) throw error;

  let financingUpdated = 0;
  let contactUpdated = 0;
  for (const c of courses ?? []) {
    const patch: Record<string, unknown> = {};
    const fin = String(c.financing_modalities ?? "").trim();
    if (
      !fin ||
      /^opco$/i.test(fin) ||
      /opco possible|prise en charge opco(?! possible après)/i.test(fin) ||
      fin === "Entreprise" ||
      fin === "Fonds propres"
    ) {
      // Remplace les libellés trop courts ou « OPCO » présenté comme disponible.
      if (fin !== QUALIOPI_FINANCING_COPY) {
        patch.financing_modalities = QUALIOPI_FINANCING_COPY;
      }
    } else if (/opco/i.test(fin) && !/en cours|après obtention/i.test(fin)) {
      patch.financing_modalities = QUALIOPI_FINANCING_COPY;
    }

    const contact = String(c.contact_referent ?? "");
    if (!contact.trim() || /contact@byound\.fr|referent-handicap@byound\.fr/i.test(contact)) {
      patch.contact_referent = QUALIOPI_PUBLIC_CONTACT_LINE;
    }
    const handicap = String(c.handicap_referent ?? "");
    if (!handicap.trim() || /referent-handicap@byound\.fr/i.test(handicap)) {
      patch.handicap_referent = QUALIOPI_HANDICAP_REFERENT_LINE;
    }

    if (Object.keys(patch).length) {
      const { error: upErr } = await sb.from("training_courses").update(patch).eq("id", c.id);
      if (upErr) throw upErr;
      if (patch.financing_modalities) financingUpdated += 1;
      if (patch.contact_referent || patch.handicap_referent) contactUpdated += 1;
      console.log("updated", c.slug, Object.keys(patch).join(","));
    }
  }

  // 2) Fiche « 3 h pour comprendre l'IA »
  const ia =
    (courses ?? []).find((c) =>
      /3.?h.?pour.?comprendre.?l.?ia|comprendre-l-ia/i.test(
        `${c.slug} ${c.title}`,
      ),
    ) ?? null;
  if (!ia) {
    console.warn("Fiche 3 h IA introuvable — skip modalités");
  } else {
    const objectives = Array.isArray(ia.objectives)
      ? (ia.objectives as string[]).map((o) =>
          String(o)
            .replace(/^à l['’]issue de (cette |la )?formation[,:\s]*/i, "")
            .replace(/^(le |la |l['’])?participant(e)? sera capable de\s*/i, "")
            .trim(),
        )
      : ia.objectives;
    const { error: iaErr } = await sb
      .from("training_courses")
      .update({
        pedagogical_modality: "elearning_asynchrone",
        pedagogical_modality_detail: QUALIOPI_ELEARNING_3H_MODALITY,
        methodology: [...QUALIOPI_ELEARNING_3H_METHODS],
        objectives,
        financing_modalities: QUALIOPI_FINANCING_COPY,
        contact_referent: QUALIOPI_PUBLIC_CONTACT_LINE,
        handicap_referent: QUALIOPI_HANDICAP_REFERENT_LINE,
        formats: ["Distanciel"],
        prerequisites: String(ia.prerequisites ?? "").trim() || "Aucun prérequis spécifique.",
      })
      .eq("id", ia.id);
    if (iaErr) throw iaErr;
    console.log("IA 3h OK", ia.slug, ia.id);
  }

  // 3) Prérequis « Niveau 3 recommandé » → texte fiche propre (management Printngo)
  const { data: niveau3 } = await sb
    .from("training_courses")
    .select("id, slug, prerequisites")
    .ilike("prerequisites", "%Niveau 3%");
  for (const row of niveau3 ?? []) {
    const { error: pErr } = await sb
      .from("training_courses")
      .update({
        prerequisites:
          "Aucun prérequis spécifique. Une première expérience d'encadrement est un plus.",
      })
      .eq("id", row.id);
    if (pErr) throw pErr;
    console.log("prerequisites fixed", row.slug);
  }

  console.log({
    financingUpdated,
    contactUpdated,
    contactEmail: QUALIOPI_PUBLIC_CONTACT_EMAIL,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
