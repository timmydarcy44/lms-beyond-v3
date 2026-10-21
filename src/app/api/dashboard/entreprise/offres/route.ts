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

  const pathIds = internal.map((path) => path.id);
  const enrolledByPath = new Map<string, number>();
  let recentEnrollments: Array<{
    id: string;
    offer_id: string;
    offer_title: string;
    name: string;
    created_at: string | null;
    href: string;
  }> = [];
  if (pathIds.length > 0) {
    const { data: enrollments } = await service
      .from("path_enrollments")
      .select("user_id, path_id, created_at")
      .in("path_id", pathIds);
    for (const row of enrollments ?? []) {
      const pathId = String(row.path_id ?? "");
      if (!pathId) continue;
      enrolledByPath.set(pathId, (enrolledByPath.get(pathId) ?? 0) + 1);
    }
    const latest = [...(enrollments ?? [])]
      .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
      .slice(0, 6);
    const userIds = [...new Set(latest.map((row) => String(row.user_id ?? "")).filter(Boolean))];
    const names = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: people } = await service.from("profiles").select("id, first_name, last_name, full_name").in("id", userIds);
      for (const person of people ?? []) {
        const full = [person.first_name, person.last_name].filter(Boolean).join(" ").trim() || String(person.full_name ?? "").trim();
        if (full) names.set(String(person.id), full);
      }
    }
    const titles = new Map(internal.map((path) => [path.id, path.title]));
    recentEnrollments = latest.map((row) => {
      const pathId = String(row.path_id ?? "");
      const userId = String(row.user_id ?? "");
      return {
        id: `${pathId}-${userId}`,
        offer_id: pathId,
        offer_title: titles.get(pathId) ?? "",
        name: names.get(userId) || "Apprenant",
        created_at: (row.created_at as string | null) ?? null,
        href: `/dashboard/formateur/parcours/${pathId}`,
      };
    });
  }

  const formationCards = internal.map((path) => ({
    id: path.id,
    title: path.title,
    status: path.raw_status,
    enrolled: enrolledByPath.get(path.id) ?? 0,
    seats: null as number | null,
    updated_at: path.updated_at,
    href: `/dashboard/formateur/parcours/${path.id}`,
  }));

  return NextResponse.json({
    organisation: { id: orgId, name: String((org as { name?: string })?.name ?? ""), edge_tier: tier },
    internal_formations: internal,
    formation_cards: formationCards,
    recent_enrollments: recentEnrollments,
    edge_catalogue: catalogue,
    edge_tier: tier,
  });
}
