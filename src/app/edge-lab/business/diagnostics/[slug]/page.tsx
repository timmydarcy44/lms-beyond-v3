import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { EdgeDiagnosticsDetailPage } from "@/components/edge-site/business/diagnostics/edge-diagnostics-detail-page";
import {
  getDiagnosticBySlug,
  getDiagnosticSlugs,
} from "@/lib/edge-site/diagnostics-catalog";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

type Params = { slug: string };

export function generateStaticParams() {
  return getDiagnosticSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const diagnostic = getDiagnosticBySlug(slug);
  if (!diagnostic) {
    return { title: "Diagnostic introuvable — EDGE Business" };
  }
  return {
    title: `${diagnostic.title} — Diagnostics EDGE`,
    description: diagnostic.shortDescription,
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const diagnostic = getDiagnosticBySlug(slug);
  if (!diagnostic) notFound();

  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgeDiagnosticsDetailPage
      diagnostic={diagnostic}
      catalogueHref={routes.businessDiagnostics}
      demoHref={routes.businessDemo}
    />
  );
}
