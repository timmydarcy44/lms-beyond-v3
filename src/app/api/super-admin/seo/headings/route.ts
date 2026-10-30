import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { headingsCacheStale, refreshHeadingsForPath } from "@/lib/seo/refresh-headings";
import { loadSeoPage } from "@/lib/seo/byound-seo";

const bodySchema = z.object({
  path: z.string().min(1),
  force: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !parsed.data.path.startsWith("/")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }
  const page = await loadSeoPage(parsed.data.path);
  if (!parsed.data.force && !headingsCacheStale(page.headings_cached_at)) {
    return NextResponse.json({ ok: true, cache: page.headings_cache, stale: false });
  }
  try {
    const cache = await refreshHeadingsForPath(parsed.data.path, parsed.data.force === true);
    return NextResponse.json({ ok: true, cache, stale: false });
  } catch (error) {
    return NextResponse.json(
      { ok: false, cache: page.headings_cache, error: error instanceof Error ? error.message : "Lecture HTML impossible" },
      { status: 200 },
    );
  }
}
