import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { byoundSeoCatalog, loadSeoPage, seoScore, type SeoPageRecord } from "@/lib/seo/byound-seo";
import { persistSeoScore } from "@/lib/seo/persist-score";
import { draftFromBody, liveRowFromDraft, seoFieldsSchema } from "@/lib/seo/seo-fields";

const SEO_SQL_HINT =
  "Table site_seo_pages absente — collez supabase/migrations/20261027210000_site_seo_pages.sql puis 20261028100000_seo_v2.sql dans le SQL Editor.";

function missing(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}

function missingColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST204" || /column .* does not exist/i.test(error.message ?? "");
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = seoFieldsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const path = parsed.data.path.trim();
  if (!path.startsWith("/")) return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const session = await getSession();
  const previous = await loadSeoPage(path);
  const draft = draftFromBody(path, parsed.data, previous);
  const row = liveRowFromDraft(path, draft, session?.id ?? null);

  const snapshot = await db.from("site_seo_versions").insert({
    path,
    snapshot: previous,
    published_by: session?.id ?? null,
  });
  if (snapshot.error && !missing(snapshot.error) && !missingColumn(snapshot.error)) {
    console.warn("[seo] version", snapshot.error.message);
  }

  let { error } = await db.from("site_seo_pages").upsert(row, { onConflict: "path" });
  if (error && missingColumn(error)) {
    const legacy = {
      path: row.path,
      title: row.title,
      meta_description: row.meta_description,
      h1: row.h1,
      h2: row.h2,
      og_title: row.og_title,
      og_description: row.og_description,
      keywords: row.keywords,
      ai_summary: row.ai_summary,
      faq: row.faq,
      noindex: row.noindex,
      updated_at: row.updated_at,
      updated_by: row.updated_by,
    };
    ({ error } = await db.from("site_seo_pages").upsert(legacy, { onConflict: "path" }));
  }
  if (error) {
    return NextResponse.json({ error: missing(error) ? SEO_SQL_HINT : error.message }, { status: missing(error) ? 200 : 500 });
  }

  const catalog = byoundSeoCatalog();
  const merged = await Promise.all(catalog.map((item) => loadSeoPage(item.path)));
  const peers = merged.map((page) => ({ path: page.path, title: page.title, meta_description: page.meta_description }));
  const current = merged.find((page) => page.path === path) ?? (await loadSeoPage(path));
  const checks = await persistSeoScore(current as SeoPageRecord, peers);
  const scored = seoScore(current, peers);

  revalidatePath(path === "/" ? "/" : path);
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/robots.txt");

  void import("@/lib/seo/refresh-headings").then((mod) => mod.refreshHeadingsForPath(path, true)).catch(() => undefined);

  return NextResponse.json({ ok: true, published: true, score: scored.score, issues: scored.issues, checks });
}
