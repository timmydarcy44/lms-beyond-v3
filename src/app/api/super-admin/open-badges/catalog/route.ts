import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { readCompetencies, type ByoundCompetencyDraft } from "@/lib/openbadges/badge-builder";
import { PROTECTED_BADGE_IDS, retargetCompetency } from "@/lib/openbadges/competency-library";
import {
  slugify,
  type BadgeDomainRecord,
  type BadgeSeriesRecord,
} from "@/lib/openbadges/badge-catalog";

type Catalog = {
  domains: BadgeDomainRecord[];
  series: BadgeSeriesRecord[];
  competencies: ByoundCompetencyDraft[];
};

const empty = (): Catalog => ({ domains: [], series: [], competencies: [] });

function missingTable(message: string): boolean {
  return /does not exist|schema cache|42P01/i.test(message);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function mergeCatalog(base: Catalog, extra: Catalog): Catalog {
  const domains = [...base.domains];
  const series = [...base.series];
  const competencies = [...base.competencies];
  for (const item of extra.domains) if (!domains.some((row) => row.id === item.id)) domains.push(item);
  for (const item of extra.series) if (!series.some((row) => row.id === item.id)) series.push(item);
  for (const item of extra.competencies) if (!competencies.some((row) => row.id === item.id || row.slug === item.slug)) competencies.push(item);
  return { domains, series, competencies };
}

function catalogFromBuilder(builder: unknown): Catalog {
  const source = asRecord(builder);
  const stored = asRecord(source.catalog);
  const domains = Array.isArray(stored.domains) ? stored.domains.flatMap(readDomain) : [];
  const series = Array.isArray(stored.series) ? stored.series.flatMap(readSeries) : [];
  if (source.domain && typeof source.domain === "string" && !domains.some((item) => item.name === source.domain)) {
    domains.push({ id: String(source.domainId ?? slugify(source.domain)), name: source.domain, slug: slugify(source.domain), color: String(source.domainColor ?? "#6E5BFF"), icon: String(source.domainIcon ?? "brain"), archivedAt: null });
  }
  if (typeof source.seriesName === "string" && source.seriesName.trim()) {
    const name = source.seriesName.trim();
    if (!series.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      series.push({ id: String(source.seriesId ?? slugify(name)), name, domainId: typeof source.domainId === "string" ? source.domainId : null });
    }
  }
  return { domains, series, competencies: readCompetencies(source) };
}

function readDomain(value: unknown): BadgeDomainRecord[] {
  const row = asRecord(value);
  const name = String(row.name ?? "").trim();
  if (!name) return [];
  return [{
    id: String(row.id ?? slugify(name)),
    name,
    slug: String(row.slug ?? slugify(name)),
    color: String(row.color ?? "#6E5BFF"),
    icon: String(row.icon ?? "brain"),
    archivedAt: typeof row.archivedAt === "string" ? row.archivedAt : null,
  }];
}

function readSeries(value: unknown): BadgeSeriesRecord[] {
  const row = asRecord(value);
  const name = String(row.name ?? "").trim();
  if (!name) return [];
  return [{ id: String(row.id ?? slugify(name)), name, domainId: typeof row.domainId === "string" ? row.domainId : null }];
}

async function readTables(): Promise<Catalog | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;
  const domains = await supabase.from("badge_domains").select("id, name, slug, color, icon, archived_at");
  if (domains.error) return missingTable(domains.error.message) ? null : empty();
  const series = await supabase.from("badge_series").select("id, name, domain_id");
  const competencies = await supabase.from("competencies").select("id, slug, name, definition, domain_id, status, validated_by, validated_at, archived_at");
  return {
    domains: (domains.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      color: String(row.color ?? "#6E5BFF"),
      icon: String(row.icon ?? "brain"),
      archivedAt: row.archived_at ? String(row.archived_at) : null,
    })),
    series: (series.data ?? []).map((row) => ({ id: String(row.id), name: String(row.name), domainId: row.domain_id ? String(row.domain_id) : null })),
    competencies: (competencies.data ?? []).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      definition: String(row.definition ?? ""),
      domainId: row.domain_id ? String(row.domain_id) : null,
      status: row.status === "draft" ? "draft" as const : "validated" as const,
      validatedBy: row.validated_by ? String(row.validated_by) : null,
      validatedAt: row.validated_at ? String(row.validated_at) : null,
      archivedAt: row.archived_at ? String(row.archived_at) : null,
    })),
  };
}

async function readEmbedded(): Promise<Catalog> {
  const supabase = getServiceRoleClient();
  if (!supabase) return empty();
  const { data } = await supabase.from("open_badges").select("status, evaluation_config").limit(400);
  return (data ?? []).reduce((catalog, row) => {
    if (String(row.status ?? "").toLowerCase() === "active") return catalog;
    return mergeCatalog(catalog, catalogFromBuilder(asRecord(row.evaluation_config).builder));
  }, empty());
}

async function loadCatalog(): Promise<Catalog> {
  const tables = await readTables();
  const embedded = await readEmbedded();
  return tables ? mergeCatalog(tables, embedded) : embedded;
}

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const catalog = await loadCatalog();
  return NextResponse.json(catalog);
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = asRecord(await request.json().catch(() => null));
  const catalog = await loadCatalog();
  const action = String(body.action ?? "");

  if (action === "upsert-domain") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const domain: BadgeDomainRecord = {
      id: String(body.id ?? crypto.randomUUID()),
      name,
      slug: slugify(name),
      color: String(body.color ?? "#6E5BFF"),
      icon: String(body.icon ?? "brain"),
      archivedAt: body.archived ? new Date().toISOString() : null,
    };
    const domains = catalog.domains.some((item) => item.id === domain.id)
      ? catalog.domains.map((item) => item.id === domain.id ? domain : item)
      : [...catalog.domains, domain];
    await persist({ ...catalog, domains });
    return NextResponse.json({ domain, catalog: { ...catalog, domains } });
  }

  if (action === "merge-domains") {
    const sourceId = String(body.sourceId ?? "");
    const targetId = String(body.targetId ?? "");
    const domains = catalog.domains.filter((item) => item.id !== sourceId);
    const competencies = catalog.competencies.map((item) => item.domainId === sourceId ? { ...item, domainId: targetId } : item);
    await persist({ ...catalog, domains, competencies });
    return NextResponse.json({ catalog: { ...catalog, domains, competencies } });
  }

  if (action === "upsert-series") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const seriesItem: BadgeSeriesRecord = { id: String(body.id ?? crypto.randomUUID()), name, domainId: typeof body.domainId === "string" ? body.domainId : null };
    const series = catalog.series.some((item) => item.id === seriesItem.id || item.name.toLowerCase() === name.toLowerCase())
      ? catalog.series.map((item) => item.name.toLowerCase() === name.toLowerCase() ? { ...item, ...seriesItem, id: item.id } : item)
      : [...catalog.series, seriesItem];
    await persist({ ...catalog, series });
    return NextResponse.json({ series: series.find((item) => item.name.toLowerCase() === name.toLowerCase()), catalog: { ...catalog, series } });
  }

  if (action === "upsert-competency") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const competency: ByoundCompetencyDraft = {
      id: String(body.id ?? crypto.randomUUID()),
      slug: slugify(String(body.slug ?? name)),
      name,
      definition: String(body.definition ?? "").trim(),
      domainId: typeof body.domainId === "string" ? body.domainId : null,
      status: body.status === "validated" ? "validated" : "draft",
      validatedBy: typeof body.validatedBy === "string" ? body.validatedBy : null,
      validatedAt: typeof body.validatedAt === "string" ? body.validatedAt : null,
      archivedAt: body.archived ? new Date().toISOString() : null,
    };
    const competencies = catalog.competencies.some((item) => item.id === competency.id)
      ? catalog.competencies.map((item) => item.id === competency.id ? competency : item)
      : [...catalog.competencies, competency];
    await persist({ ...catalog, competencies });
    return NextResponse.json({ competency, catalog: { ...catalog, competencies } });
  }

  if (action === "merge-competencies") {
    const sourceId = String(body.sourceId ?? "");
    const targetId = String(body.targetId ?? "");
    await retargetCompetency(sourceId, targetId);
    const competencies = catalog.competencies.filter((item) => item.id !== sourceId);
    await persist({ ...catalog, competencies });
    return NextResponse.json({ catalog: { ...catalog, competencies } });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

async function persist(catalog: Catalog) {
  const supabase = getServiceRoleClient();
  if (!supabase) return;
  const probe = await supabase.from("badge_domains").select("id").limit(1);
  if (!probe.error) {
    const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    for (const domain of catalog.domains) {
      if (!uuid(domain.id)) continue;
      await supabase.from("badge_domains").upsert({
        id: domain.id,
        name: domain.name,
        slug: domain.slug,
        color: domain.color,
        icon: domain.icon,
        archived_at: domain.archivedAt,
      });
    }
    for (const series of catalog.series) {
      if (!uuid(series.id)) continue;
      await supabase.from("badge_series").upsert({ id: series.id, name: series.name, domain_id: series.domainId });
    }
    for (const competency of catalog.competencies) {
      if (!uuid(competency.id)) continue;
      await supabase.from("competencies").upsert({
        id: competency.id,
        slug: competency.slug,
        name: competency.name,
        definition: competency.definition,
        domain_id: competency.domainId,
        status: competency.status,
        validated_by: competency.validatedBy,
        validated_at: competency.validatedAt,
        archived_at: competency.archivedAt,
      });
    }
    return;
  }
  const { data } = await supabase.from("open_badges").select("id, status, evaluation_config").limit(400);
  for (const row of data ?? []) {
    if (String(row.status ?? "").toLowerCase() === "active" || PROTECTED_BADGE_IDS.has(String(row.id))) continue;
    const config = asRecord(row.evaluation_config);
    const builder = { ...asRecord(config.builder), catalog };
    await supabase.from("open_badges").update({ evaluation_config: { ...config, builder } }).eq("id", row.id);
  }
}
