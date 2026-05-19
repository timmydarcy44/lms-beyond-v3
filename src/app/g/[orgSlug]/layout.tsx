import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getServerClient } from "@/lib/supabase/server";
import { EDGE_LAB_GALAXY_LOGO_URL, isEdgeLabOrganizationSlug } from "@/lib/galaxy-branding";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GalaxyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const slug = String(orgSlug ?? "").trim();
  if (!slug) notFound();

  const supabase = await getServerClient();
  if (!supabase) return <>{children}</>;

  let primaryColor: string | null = null;
  let logoUrl: string | null = null;

  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("primary_color, logo_url, logo")
      .eq("slug", slug)
      .maybeSingle();
    primaryColor = String((org as any)?.primary_color ?? "").trim() || null;
    logoUrl = String((org as any)?.logo_url ?? (org as any)?.logo ?? "").trim() || null;
  } catch {
    primaryColor = null;
    logoUrl = null;
  }

  if (isEdgeLabOrganizationSlug(slug)) {
    logoUrl = EDGE_LAB_GALAXY_LOGO_URL;
  }

  return (
    <div
      data-org-slug={slug}
      data-org-logo-url={logoUrl ?? undefined}
      style={primaryColor ? ({ ["--primary" as any]: primaryColor } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

