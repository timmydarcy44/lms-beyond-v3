import { NextResponse } from "next/server";
import {
  getEntrepriseOverviewServiceClient,
  resolveEntrepriseOverviewAccess,
} from "@/lib/entreprise/overview-route";

export const dynamic = "force-dynamic";

const EDGE_CATALOGUE = [
  {
    id: "edge-core",
    title: "Beyond Core",
    tier: "Core",
    min_tier: 1,
    description: "Fondamentaux RH, diagnostics et parcours essentiels.",
    badge: "Core",
  },
  {
    id: "edge-grow",
    title: "Beyond Grow",
    tier: "Grow",
    min_tier: 2,
    description: "Montée en compétences, analytics équipe et formations avancées.",
    badge: "Grow",
  },
  {
    id: "edge-transform",
    title: "Beyond Transform",
    tier: "Transform",
    min_tier: 3,
    description: "Marketplace BCT, mobilité interne et pilotage stratégique.",
    badge: "Transform",
  },
];

export async function GET() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({
      super_admin_preview: true,
      internal_formations: [],
      edge_catalogue: EDGE_CATALOGUE.map((c) => ({ ...c, available: false })),
      edge_tier: 1,
    });
  }

  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({
      configuration_required: true,
      internal_formations: [],
      edge_catalogue: EDGE_CATALOGUE,
      edge_tier: 1,
    });
  }

  const orgId = access.organizationId;
  const service = getEntrepriseOverviewServiceClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const [{ data: org }, { data: paths }] = await Promise.all([
    service.from("organizations").select("edge_enterprise_tier, name").eq("id", orgId).maybeSingle(),
    service
      .from("paths")
      .select("id, title, status, created_at, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false }),
  ]);

  const tier = Number((org as { edge_enterprise_tier?: number })?.edge_enterprise_tier ?? 1);
  const catalogue = EDGE_CATALOGUE.map((c) => ({
    ...c,
    available: tier >= c.min_tier,
  }));

  const internal = (paths ?? []).map((p) => {
    const status = String(p.status ?? "draft").toLowerCase();
    let label = "Brouillon";
    if (status === "published") label = "Actif";
    else if (status === "archived") label = "Archivé";
    return {
      id: p.id as string,
      title: String(p.title ?? "Sans titre"),
      status: label,
      raw_status: status,
      created_at: (p.created_at as string | null) ?? null,
      updated_at: (p.updated_at as string | null) ?? null,
    };
  });

  return NextResponse.json({
    organisation: { id: orgId, name: String((org as { name?: string })?.name ?? ""), edge_tier: tier },
    internal_formations: internal,
    edge_catalogue: catalogue,
    edge_tier: tier,
  });
}
