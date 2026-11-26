/**
 * Aligne tous les modules « 3 h » sur e-learning asynchrone Byound.
 *   pnpm exec tsx scripts/fix-3h-modules-modalities.ts
 */
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  QUALIOPI_ELEARNING_3H_METHODS,
  QUALIOPI_ELEARNING_3H_MODALITY,
  QUALIOPI_FINANCING_COPY,
} from "../src/lib/qualiopi/public-copy";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data, error } = await sb
    .from("training_courses")
    .select("id,slug,title,duration,prerequisites")
    .eq("is_active", true);
  if (error) throw error;

  let n = 0;
  for (const c of data ?? []) {
    const slug = String(c.slug);
    const title = String(c.title);
    const duration = String(c.duration ?? "");
    const is3h =
      /^3-h-/i.test(slug) ||
      /^3 h /i.test(title) ||
      /^3\s*h\b/i.test(duration);
    if (!is3h) continue;
    const { error: upErr } = await sb
      .from("training_courses")
      .update({
        pedagogical_modality: "elearning_asynchrone",
        pedagogical_modality_detail: QUALIOPI_ELEARNING_3H_MODALITY,
        methodology: [...QUALIOPI_ELEARNING_3H_METHODS],
        formats: ["Distanciel"],
        financing_modalities: QUALIOPI_FINANCING_COPY,
        prerequisites:
          String(c.prerequisites ?? "").trim() || "Aucun prérequis spécifique.",
      })
      .eq("id", c.id);
    if (upErr) throw upErr;
    n += 1;
    console.log("OK", slug);
  }
  console.log(`fixed ${n} modules 3 h`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
