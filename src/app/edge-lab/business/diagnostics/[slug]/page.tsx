import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

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
  const test = getDiagnosticBySlug(slug);
  if (!test) {
    return { title: "Test introuvable — Byound Business" };
  }
  return {
    title: `${test.title} — Tests Byound`,
    description: test.shortDescription,
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (slug === "psychologie-comportementale") {
    const host = (await headers()).get("host");
    const routes = getEdgeMarketingRoutes(host);
    permanentRedirect(`${routes.businessDiagnostics}/test-comportemental`);
  }
  const test = getDiagnosticBySlug(slug);
  if (!test) notFound();

  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgeDiagnosticsDetailPage
      test={test}
      catalogueHref={routes.businessDiagnostics}
      demoHref={routes.businessDemo}
    />
  );
}
