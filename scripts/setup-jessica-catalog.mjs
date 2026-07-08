/**
 * Crée catalog_items + catalog_access et seed les formations Jessica studio.
 * Usage: node scripts/setup-jessica-catalog.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL manquant dans .env.local");
  process.exit(1);
}

const JESSICA_EMAIL = "contentin.cabinet@gmail.com";
const JESSICA_STUDIO_ORG_ID = "17d6def2-2422-4628-83ab-24b04746c19c";

const migrationSql = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260708220000_create_catalog_items_and_access.sql"),
  "utf8",
);

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  console.log("→ Application migration catalog_items / catalog_access…");
  await client.query(migrationSql);

  const profileRes = await client.query(
    `SELECT id FROM public.profiles WHERE lower(email) = lower($1) LIMIT 1`,
    [JESSICA_EMAIL],
  );
  const jessicaId = profileRes.rows[0]?.id;
  if (!jessicaId) {
    console.error("Profil Jessica introuvable");
    process.exit(1);
  }
  console.log("→ Jessica profile:", jessicaId);

  const coursesRes = await client.query(
    `SELECT id, title, description, cover_image, status
     FROM public.courses
     WHERE org_id = $1 OR creator_id = $2`,
    [JESSICA_STUDIO_ORG_ID, jessicaId],
  );
  console.log(`→ ${coursesRes.rows.length} formation(s) studio à synchroniser`);

  for (const course of coursesRes.rows) {
    const existing = await client.query(
      `SELECT id FROM public.catalog_items
       WHERE content_id = $1 AND item_type = 'module'
       ORDER BY created_at DESC LIMIT 1`,
      [course.id],
    );

    if (existing.rows[0]?.id) {
      await client.query(
        `UPDATE public.catalog_items SET
          title = $2, description = $3, short_description = $4,
          hero_image_url = $5, thumbnail_url = $5,
          creator_id = $6, created_by = $6, is_active = true, updated_at = now()
         WHERE id = $1`,
        [
          existing.rows[0].id,
          course.title,
          course.description,
          course.description?.substring(0, 150) ?? null,
          course.cover_image,
          jessicaId,
        ],
      );
      console.log("  ✓ mis à jour:", course.title);
    } else {
      await client.query(
        `INSERT INTO public.catalog_items (
          content_id, item_type, title, description, short_description,
          price, is_free, target_audience, hero_image_url, thumbnail_url,
          creator_id, created_by, is_active
        ) VALUES ($1,'module',$2,$3,$4,0,true,'apprenant',$5,$5,$6,$6,true)`,
        [
          course.id,
          course.title,
          course.description,
          course.description?.substring(0, 150) ?? null,
          course.cover_image,
          jessicaId,
        ],
      );
      console.log("  ✓ créé:", course.title);
    }
  }

  const countRes = await client.query(
    `SELECT count(*)::int AS n FROM public.catalog_items WHERE creator_id = $1 OR created_by = $1`,
    [jessicaId],
  );
  console.log(`\n✅ Terminé — ${countRes.rows[0].n} catalog_item(s) Jessica`);
} finally {
  await client.end();
}
