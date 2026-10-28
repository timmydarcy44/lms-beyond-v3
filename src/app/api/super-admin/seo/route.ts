import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { byoundSeoCatalog, loadSeoPage, seoScore, type SeoPageRecord } from "@/lib/seo/byound-seo";

export const SEO_SQL_HINT =
  "Table site_seo_pages absente — collez supabase/migrations/20261027210000_site_seo_pages.sql dans le SQL Editor.";

function missing(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const pages = await Promise.all(
    byoundSeoCatalog().map(async (item) => {
      const merged = await loadSeoPage(item.path);
      return { ...item, ...merged, ...seoScore(merged) };
    }),
  );
  return NextResponse.json({ pages });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as Partial<SeoPageRecord> | null;
  const path = String(body?.path ?? "").trim();
  if (!path.startsWith("/")) return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const session = await getSession();
  const row = {
    path,
    title: body?.title?.trim() || null,
    meta_description: body?.meta_description?.trim() || null,
    h1: body?.h1?.trim() || null,
    h2: Array.isArray(body?.h2) ? body.h2.map((item) => String(item).trim()).filter(Boolean) : [],
    og_title: body?.og_title?.trim() || null,
    og_description: body?.og_description?.trim() || null,
    keywords: Array.isArray(body?.keywords) ? body.keywords.map((item) => String(item).trim()).filter(Boolean) : [],
    ai_summary: body?.ai_summary?.trim() || null,
    faq: Array.isArray(body?.faq)
      ? body.faq.filter((item) => item?.question?.trim() && item?.answer?.trim())
      : [],
    noindex: body?.noindex === true,
    updated_at: new Date().toISOString(),
    updated_by: session?.id ?? null,
  };
  const { error } = await db.from("site_seo_pages").upsert(row, { onConflict: "path" });
  if (error) {
    return NextResponse.json({ error: missing(error) ? SEO_SQL_HINT : error.message }, { status: missing(error) ? 200 : 500 });
  }
  return NextResponse.json({ ok: true });
}
