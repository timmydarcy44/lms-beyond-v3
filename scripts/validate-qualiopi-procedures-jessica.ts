/**
 * Met à jour le déroulement « moyens », puis valide toutes les procédures
 * au nom de Jessica Contentin (PDF + version 1.0).
 *
 *   pnpm exec tsx scripts/validate-qualiopi-procedures-jessica.ts
 */
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { buildProcedurePdf } from "../src/lib/qualiopi/procedure-pdf";
import {
  countFilledSections,
  PROCEDURE_SECTION_KEYS,
} from "../src/lib/qualiopi/procedure-sections";
import { nextMajorVersion } from "../src/lib/qualiopi/procedure-status";
import { formatFrDateShort } from "../src/lib/qualiopi/reclamation-format";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

const BUCKET = "qualiopi-procedures";

const JESSICA = {
  id: "fcdc770d-4474-43ae-97d6-e70ef7e58779",
  name: "Jessica Contentin",
};

/** Section 4 — Déroulement (procédure moyens). Placeholders résolus. */
export const MOYENS_DEROULEMENT = `## Moyens humains
Jessica Contentin, présidente, formatrice et référente handicap, coordonne les sessions. Les formateurs externes interviennent sous contrat de prestation (ex. : Jérôme Picot, leadership et commercial), après validation de leur CV et passage des trois tests Byound. Les commerciaux recueillent les besoins ; la présidente les valide.

## Moyens techniques
- LMS Byound (parcours, ressources, quiz, jeux, suivi du temps et de la progression, relevé LMS individuel)
- Byound Control (programmation, convocations, émargement électronique par demi-journée, documents signés électroniquement)
- Visioconférence Google Meet lorsque une session synchrone est prévue
- Matériel du formateur : ordinateur portable, vidéoprojecteur portable et câbles HDMI / USB-C

## Locaux
- Formations en intra dans les locaux du client (salle de réunion, vidéoprojecteur ou écran, wifi, accès PMR demandés à la signature de la convention)
- Siège administratif au 134 rue Élise Deroche, 14760 Bretteville-sur-Odon : n’accueille pas de stagiaires en formation ; l’accessibilité PMR est assurée sur les lieux d’accueil client et via le LMS en distanciel
- Formations à distance via le LMS

## Continuité
En cas d’indisponibilité d’un formateur, remplacement par un expert validé du réseau Byound, ou report de la session avec l’accord du client.`;

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env manquant");
  const sb = createClient(url, key);

  const { data: moyens, error: moyensErr } = await sb
    .from("crm_qualiopi_procedures")
    .select("id")
    .eq("slug", "moyens")
    .maybeSingle();
  if (moyensErr) throw moyensErr;
  if (!moyens) throw new Error("Procédure moyens introuvable");

  const { error: secErr } = await sb
    .from("crm_qualiopi_procedure_sections")
    .update({ content: MOYENS_DEROULEMENT, updated_at: new Date().toISOString() })
    .eq("procedure_id", moyens.id)
    .eq("key", "deroulement");
  if (secErr) throw secErr;
  console.log("✓ moyens.deroulement mis à jour");

  // Compatibilité ancien signal process_docs (ready)
  await sb
    .from("crm_qualiopi_process_docs")
    .update({ status: "ready", updated_at: new Date().toISOString() })
    .neq("kind", "__none__");

  const { data: procs, error } = await sb
    .from("crm_qualiopi_procedures")
    .select("*, sections:crm_qualiopi_procedure_sections(*)")
    .order("slug");
  if (error) throw error;

  const effectiveDate = new Date().toISOString().slice(0, 10);
  const nextReviewAt = addMonths(effectiveDate, 12);
  const audiences = ["formateurs", "equipe"];
  const now = new Date().toISOString();

  await sb.storage.createBucket(BUCKET, { public: false }).catch(() => null);

  for (const proc of procs ?? []) {
    const sections = Array.isArray(proc.sections) ? proc.sections : [];
    const filled = countFilledSections(sections);
    if (filled < 7) {
      console.warn(`⚠ ${proc.slug}: ${filled}/7 sections — skip`);
      continue;
    }

    const version = nextMajorVersion(proc.current_version);
    const snapshot = {
      title: proc.title,
      version,
      sections: PROCEDURE_SECTION_KEYS.map((key) => {
        const s = sections.find((x: { key: string }) => x.key === key);
        return { key, content: s?.content ?? "", position: s?.position ?? 0 };
      }),
      audiences,
      effective_date: effectiveDate,
      next_review_at: nextReviewAt,
    };

    const pdf = await buildProcedurePdf({
      title: proc.title,
      version,
      effectiveDate: formatFrDateShort(effectiveDate),
      validatedByName: JESSICA.name,
      validatedAt: formatFrDateShort(now),
      nextReviewAt: formatFrDateShort(nextReviewAt),
      sections: snapshot.sections,
    });

    const pdfPath = `${proc.slug}/${version}-${Date.now()}.pdf`;
    const upload = await sb.storage.from(BUCKET).upload(pdfPath, pdf, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upload.error) {
      console.error(`PDF ${proc.slug}:`, upload.error.message);
      continue;
    }

    const { error: verErr } = await sb.from("crm_qualiopi_procedure_versions").upsert(
      {
        procedure_id: proc.id,
        version,
        pdf_path: pdfPath,
        content_snapshot: snapshot,
        validated_by: JESSICA.id,
        validated_by_name: JESSICA.name,
        validated_at: now,
        effective_date: effectiveDate,
        next_review_at: nextReviewAt,
        audiences,
      },
      { onConflict: "procedure_id,version" },
    );
    if (verErr) {
      console.error(`version ${proc.slug}:`, verErr.message);
      continue;
    }

    const { error: upErr } = await sb
      .from("crm_qualiopi_procedures")
      .update({
        status: "validated",
        current_version: version,
        owner_id: JESSICA.id,
        owner_name: JESSICA.name,
        validated_by: JESSICA.id,
        validated_by_name: JESSICA.name,
        validated_at: now,
        effective_date: effectiveDate,
        next_review_at: nextReviewAt,
        audiences,
        updated_at: now,
      })
      .eq("id", proc.id);
    if (upErr) {
      console.error(`update ${proc.slug}:`, upErr.message);
      continue;
    }

    console.log(`✓ ${proc.slug} → validée v${version} par ${JESSICA.name}`);
  }

  const { data: check } = await sb
    .from("crm_qualiopi_procedures")
    .select("slug, status, current_version, validated_by_name")
    .order("slug");
  console.log("\nÉtat final:");
  for (const p of check ?? []) {
    console.log(`  ${p.slug}: ${p.status} v${p.current_version} (${p.validated_by_name})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
