/**
 * Import patients cabinet Jessica depuis export PDF Doctolib.
 *
 * Usage:
 *   node scripts/import-jessica-cabinet-patients.mjs "chemin/vers/export.pdf"
 *
 * Prérequis: migration 20260710120000_jessica_cabinet_patients.sql appliquée.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

function parseDateFr(value) {
  if (!value) return null;
  const m = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, y, h, min] = m;
  if (h != null && min != null) {
    return new Date(`${y}-${mo}-${d}T${h}:${min}:00`).toISOString();
  }
  return `${y}-${mo}-${d}`;
}

function parseBirthDate(value) {
  const iso = parseDateFr(value);
  if (!iso) return null;
  return iso.slice(0, 10);
}

function parsePatientLine(line) {
  const trimmed = line.trim();
  const idMatch = trimmed.match(/^(\d{6,7})\s+/);
  if (!idMatch) return null;

  const external_id = idMatch[1];
  let rest = trimmed.slice(idMatch[0].length);

  let gender = null;
  const g = rest.match(/^([mfo])\s+/);
  if (g) {
    gender = g[1];
    rest = rest.slice(g[0].length);
  }

  const emails = [...rest.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)].map((x) =>
    x[0].toLowerCase(),
  );
  const email = emails[0] ?? null;
  const email_secondary = emails[1] ?? null;

  const phones = [...rest.matchAll(/\+33\d{9}|\+33\d{10}|\b0\d{9}\b/g)].map((x) => x[0]);
  const phone = phones[0] ?? null;
  const phone_secondary = phones[1] ?? null;

  let birth_date = null;
  const birthBeforePhone = rest.match(/(\d{2}\/\d{2}\/\d{4})\s+\+?33/);
  if (birthBeforePhone) birth_date = parseBirthDate(birthBeforePhone[1]);

  let last_appointment_location = null;
  let last_appointment_reason = null;
  let source_created_at = null;
  if (rest.includes("Jessica CONTENTIN")) {
    last_appointment_location = "Jessica CONTENTIN";
    const motifMatch = rest.match(
      /Jessica CONTENTIN\s+([^\t]+?)(?:\t+|\s{2,})(.*?)(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})?\s*$/,
    );
    if (motifMatch) {
      last_appointment_reason = (motifMatch[1] || motifMatch[2] || "").trim() || null;
      if (motifMatch[3]) source_created_at = parseDateFr(motifMatch[3]);
    }
  }

  const allDates = [...rest.matchAll(/\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?/g)].map((x) => x[0]);
  if (!source_created_at && allDates.length > 0) {
    const tail = allDates[allDates.length - 1];
    if (tail.includes(":")) source_created_at = parseDateFr(tail);
  }

  let past_appointments_count = 0;
  let last_appointment_at = null;
  let future_appointments_count = 0;
  let next_appointment_at = null;
  let pro_cancellations_count = 0;
  let patient_cancellations_count = 0;
  let no_show_count = 0;

  const statsMatch =
    rest.match(
      /(?:ok|Notes\s*:)?\s*(\d+)\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s+(\d+)\s+(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?)\s+(\d+)\s+(\d+)\s+(\d+)/i,
    ) ??
    rest.match(
      /(?:\+33\d{9}|\+33\d{10}|\b0\d{9}\b)\s+(\d+)\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/,
    );
  if (statsMatch) {
    past_appointments_count = Number(statsMatch[1]) || 0;
    last_appointment_at = parseDateFr(statsMatch[2]);
    future_appointments_count = Number(statsMatch[3]) || 0;
    if (statsMatch[4] && /\d{2}\/\d{2}\/\d{4}/.test(statsMatch[4])) {
      next_appointment_at = parseDateFr(statsMatch[4]);
      pro_cancellations_count = Number(statsMatch[5]) || 0;
      patient_cancellations_count = Number(statsMatch[6]) || 0;
      no_show_count = Number(statsMatch[7]) || 0;
    } else {
      pro_cancellations_count = Number(statsMatch[4]) || 0;
      patient_cancellations_count = Number(statsMatch[5]) || 0;
      no_show_count = Number(statsMatch[6]) || 0;
    }
  }

  let namePart = rest;
  if (email) {
    const idx = rest.toLowerCase().indexOf(email);
    if (idx > 0) namePart = rest.slice(0, idx);
  } else if (phone) {
    const idx = rest.indexOf(phone);
    if (idx > 0) namePart = rest.slice(0, idx);
  }

  namePart = namePart.replace(/\d{2}\/\d{2}\/\d{4}.*/s, "").trim();
  const nameChunks = namePart.split(/\t+/).map((s) => s.trim()).filter(Boolean);
  let last_name = null;
  let first_name = null;
  if (nameChunks.length >= 2) {
    last_name = nameChunks[0];
    first_name = nameChunks.slice(1).join(" ");
  } else {
    const words = namePart.split(/\s{2,}|\s+/).filter(Boolean);
    if (words.length >= 2) {
      last_name = words[0];
      first_name = words.slice(1).join(" ");
    } else if (words.length === 1) {
      last_name = words[0];
    }
  }

  let notes = null;
  let anamnesis = null;
  const notesMatch = rest.match(/Notes\s*:\s*(.+?)(?:\s+ok\s+|\s+\d+\s+\d{2}\/\d{2}\/\d{4})/is);
  if (notesMatch) {
    const text = notesMatch[1].trim();
    if (text.length > 120) anamnesis = text;
    else notes = text;
  } else if (rest.includes("\tok\t") || rest.match(/\sok\s+\d/)) {
    notes = "ok";
  }

  let address = null;
  let city = null;
  let postal_code = null;
  let country = "fr";
  const addrMatch = rest.match(
    /\+33\d{9}\s+(.+?)\s+(\d{5})\s+(fr|FR)\s+/i,
  );
  if (addrMatch) {
    const addrRaw = addrMatch[1].trim();
    const addrParts = addrRaw.split(/\t+/);
    if (addrParts.length >= 2) {
      address = addrParts[0];
      city = addrParts[addrParts.length - 1];
    } else {
      address = addrRaw;
    }
    postal_code = addrMatch[2];
    country = (addrMatch[3] || "fr").toLowerCase();
  }

  return {
    external_id,
    gender: gender ?? "unknown",
    last_name,
    first_name,
    email,
    email_secondary,
    birth_date,
    phone,
    phone_secondary,
    address,
    city,
    postal_code,
    country,
    notes,
    anamnesis,
    communication_notes: null,
    past_appointments_count,
    last_appointment_at,
    future_appointments_count,
    next_appointment_at,
    pro_cancellations_count,
    patient_cancellations_count,
    no_show_count,
    last_appointment_location,
    last_appointment_reason,
    source_created_at,
    raw_import: { line: trimmed },
    updated_at: new Date().toISOString(),
  };
}

function extractPatientLines(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^\d{6,7}\s/.test(l));
}

async function ensureTable() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");

  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const probe = await sb.from("jessica_cabinet_patients").select("id").limit(1);
  if (!probe.error) return sb;

  console.error(`
La table public.jessica_cabinet_patients n'existe pas encore.

1. Ouvrez Supabase → SQL Editor
2. Collez le contenu de :
   supabase/migrations/20260710120000_jessica_cabinet_patients.sql
3. Exécutez la requête
4. Relancez ce script d'import

Ou, si DATABASE_URL est accessible depuis votre réseau :
   node scripts/apply-jessica-patients-migration.mjs
`);
  process.exit(1);
}
async function linkProfiles(sb) {
  const { data: patients } = await sb
    .from("jessica_cabinet_patients")
    .select("id, email")
    .not("email", "is", null);

  if (!patients?.length) return 0;

  let linked = 0;
  for (const p of patients) {
    const { data: profile } = await sb
      .from("profiles")
      .select("id")
      .ilike("email", p.email)
      .maybeSingle();
    if (profile?.id) {
      await sb.from("jessica_cabinet_patients").update({ profile_id: profile.id }).eq("id", p.id);
      linked += 1;
    }
  }
  return linked;
}

async function main() {
  const pdfPath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!pdfPath) {
    console.error("Usage: node scripts/import-jessica-cabinet-patients.mjs <chemin-export.pdf> [--dry-run]");
    process.exit(1);
  }

  const abs = resolve(pdfPath);
  if (!existsSync(abs)) {
    console.error("Fichier introuvable:", abs);
    process.exit(1);
  }

  const buf = readFileSync(abs);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const text = result?.text ?? "";
  const lines = extractPatientLines(text);
  console.log(`Lignes patients détectées: ${lines.length}`);

  const rows = lines.map(parsePatientLine).filter(Boolean);
  console.log(`Lignes parsées: ${rows.length}`);
  console.log(`  avec email: ${rows.filter((r) => r.email).length}`);
  console.log(`  avec RDV stats: ${rows.filter((r) => r.past_appointments_count > 0).length}`);

  if (dryRun) {
    const sample = rows.find((r) => r.last_name === "SALMON" && r.first_name?.includes("In"));
    console.log("Exemple Inès SALMON:", JSON.stringify(sample, null, 2));
    return;
  }

  const sb = await ensureTable();

  const batchSize = 50;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await sb.from("jessica_cabinet_patients").upsert(batch, {
      onConflict: "external_id",
    });
    if (error) {
      console.error("Erreur upsert batch", i, error.message);
      process.exit(1);
    }
    upserted += batch.length;
    console.log(`  … ${upserted}/${rows.length}`);
  }

  const linked = await linkProfiles(sb);
  console.log(`Import terminé: ${upserted} patients, ${linked} liés à un compte LMS.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
