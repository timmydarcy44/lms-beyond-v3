import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { byoundSeoCatalog, loadSeoPage, seoScore } from "@/lib/seo/byound-seo";
import { DEFAULT_SEO_TEMPLATES, SEO_TEMPLATE_LABELS } from "@/lib/seo/overview";
import { fillGeneratedFields } from "@/lib/seo/templates";
import { loadSeoTemplateExamples, loadSeoTemplates, seedSeoTemplatesIfEmpty } from "@/lib/seo/resolve-generated";
import { seoHeadingsManagedByTool } from "@/lib/seo/parse-html";
import { loadAllGscQueries, loadGscOverview, loadGscPageStats } from "@/lib/seo/gsc-load";
import { draftFromBody, seoFieldsSchema } from "@/lib/seo/seo-fields";

export const SEO_SQL_HINT =
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

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const catalog = byoundSeoCatalog();
  const merged = await Promise.all(catalog.map((item) => loadSeoPage(item.path)));
  const peers = merged.map((page) => ({
    path: page.path,
    title: page.title,
    meta_description: page.meta_description,
  }));
  const [gsc, pageStats, queryMap] = await Promise.all([loadGscOverview(), loadGscPageStats(), loadAllGscQueries()]);
  const pages = catalog.map((item, index) => {
    const page = merged[index];
    const scored = seoScore(page, peers);
    const stats = pageStats.get(item.path);
    return {
      ...item,
      ...page,
      ...scored,
      impressions: gsc.configured ? (stats?.impressions ?? 0) : null,
      clicks: gsc.configured ? (stats?.clicks ?? 0) : null,
      queries: queryMap.get(item.path) ?? [],
      has_draft: Boolean(page.draft),
      headings_managed: seoHeadingsManagedByTool(item.path, item.key),
    };
  });
  const db = getServiceRoleClient();
  const countTable = async (table: string) => {
    if (!db) return 0;
    const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  };
  const [jobs, trainings, articles] = await Promise.all([
    countTable("job_offers"),
    countTable("training_courses"),
    countTable("blog_posts"),
  ]);
  const counts = { job_offer: jobs, training: trainings, article: articles };
  await seedSeoTemplatesIfEmpty().catch(() => undefined);
  const [rows, examples] = await Promise.all([loadSeoTemplates(), loadSeoTemplateExamples()]);
  const templates = rows.map((item) => {
    const example = examples[item.type];
    const preview = example ? fillGeneratedFields(item, example.vars, example.sourceDescription) : null;
    return {
      ...DEFAULT_SEO_TEMPLATES.find((card) => card.type === item.type),
      ...item,
      label: SEO_TEMPLATE_LABELS[item.type],
      count: counts[item.type],
      example: example
        ? { path: example.path, vars: example.vars, previewTitle: preview?.title ?? "", previewDescription: preview?.description ?? "" }
        : null,
    };
  });
  return NextResponse.json({
    pages,
    gsc,
    templates,
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = seoFieldsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const body = parsed.data;
  const path = body.path.trim();
  if (!path.startsWith("/")) return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const current = await loadSeoPage(path);
  const draft = draftFromBody(path, body, current);
  const now = new Date().toISOString();
  const existing = await db.from("site_seo_pages").select("path").eq("path", path).maybeSingle();
  let error = existing.data
    ? (await db.from("site_seo_pages").update({ draft, updated_at: now }).eq("path", path)).error
    : (await db.from("site_seo_pages").insert({ path, draft, updated_at: now, noindex: draft.noindex, h2: draft.h2, keywords: draft.keywords, faq: draft.faq })).error;
  if (error && missingColumn(error)) {
    error = null;
  }
  if (error) {
    return NextResponse.json({ error: missing(error) ? SEO_SQL_HINT : error.message }, { status: missing(error) ? 200 : 500 });
  }
  return NextResponse.json({ ok: true, draft: true });
}
