import { NextResponse } from "next/server";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { byoundSeoCatalog, loadSeoPage } from "@/lib/seo/byound-seo";

export async function GET() {
  const lines = [
    "# Byound",
    `> ${BYOUND_PUBLIC_ORIGIN}`,
    "",
    "Byound identifie, forme et valorise les compétences pour les écoles, les entreprises et les experts.",
    "",
    "## Pages",
  ];
  for (const item of byoundSeoCatalog()) {
    const seo = await loadSeoPage(item.path);
    if (seo.noindex) continue;
    lines.push(`- [${item.label}](${BYOUND_PUBLIC_ORIGIN}${item.path === "/" ? "/" : item.path}): ${seo.ai_summary || seo.meta_description || seo.title}`);
  }
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
