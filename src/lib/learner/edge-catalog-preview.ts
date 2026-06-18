import { getParcours, PARCOURS, type Parcours } from "@/lib/parcours";
import type { ActionPlanItem, CoachingRecommendation } from "@/lib/learner/personalized-action-plan";

/** Slugs mis en avant quand les tests ne sont pas encore passés. */
export const FEATURED_FORMATION_SLUGS = [
  "commercial-ia",
  "sales-operations-manager",
  "leader-transformation",
  "coach-facilitateur",
] as const;

export type CatalogFormationPreview = {
  slug: string;
  title: string;
  description: string;
  famille: string;
  duree: string;
  badge: string;
  href: string;
};

export function getFeaturedCatalogFormations(limit = 4): CatalogFormationPreview[] {
  const items: CatalogFormationPreview[] = [];
  for (const slug of FEATURED_FORMATION_SLUGS) {
    const p = getParcours(slug);
    if (p) items.push(toCatalogPreview(p));
    if (items.length >= limit) break;
  }
  if (items.length < limit) {
    for (const p of PARCOURS) {
      if (items.some((i) => i.slug === p.slug)) continue;
      items.push(toCatalogPreview(p));
      if (items.length >= limit) break;
    }
  }
  return items;
}

function toCatalogPreview(p: Parcours): CatalogFormationPreview {
  return {
    slug: p.slug,
    title: p.titreMarketing ?? p.titre,
    description: p.description.slice(0, 160) + (p.description.length > 160 ? "…" : ""),
    famille: p.familleLabel,
    duree: p.duree,
    badge: p.badge,
    href: `/edge-lab/parcours/${p.slug}`,
  };
}

const NEED_TO_SLUG: Array<{ pattern: RegExp; slug: string }> = [
  { pattern: /leadership|manager|pilotage|équipe/i, slug: "leader-transformation" },
  { pattern: /commercial|vente|sales|prospection/i, slug: "sales-operations-manager" },
  { pattern: /stress|émotion|bien-être|pression|facilit/i, slug: "coach-facilitateur" },
  { pattern: /communication|conflit|assertiv/i, slug: "coach-facilitateur" },
  { pattern: /ia|automation|automatisation/i, slug: "commercial-ia" },
  { pattern: /rh|talent|humain/i, slug: "hr-business-partner" },
];

export function matchParcoursForKeywords(keywords: string[]): CatalogFormationPreview[] {
  const slugs = new Set<string>();
  for (const kw of keywords) {
    for (const { pattern, slug } of NEED_TO_SLUG) {
      if (pattern.test(kw)) slugs.add(slug);
    }
  }
  const results: CatalogFormationPreview[] = [];
  for (const slug of slugs) {
    const p = getParcours(slug);
    if (p) results.push(toCatalogPreview(p));
  }
  return results.slice(0, 2);
}

export function formationsFromActionPlan(items: ActionPlanItem[]): CatalogFormationPreview[] {
  const previews: CatalogFormationPreview[] = [];
  for (const item of items) {
    if (item.kind !== "formation" && item.kind !== "micro_formation") continue;
    const slugMatch = item.href.match(/parcours\/([^/?#]+)/);
    if (slugMatch) {
      const p = getParcours(slugMatch[1]);
      if (p) {
        previews.push(toCatalogPreview(p));
        continue;
      }
    }
    previews.push({
      slug: item.id,
      title: item.title,
      description: item.description,
      famille: "Recommandé",
      duree: "—",
      badge: item.kind === "micro_formation" ? "Micro-formation" : "Formation",
      href: item.href,
    });
  }
  return previews;
}

export type EdgeParcoursBlocks = {
  coaching: CoachingRecommendation | null;
  microFormations: CatalogFormationPreview[];
  badge: ActionPlanItem | null;
};

export function buildEdgeParcoursBlocksFromPlan(
  plan: {
    coachings: CoachingRecommendation[];
    items: ActionPlanItem[];
    needs: string[];
  } | null,
): EdgeParcoursBlocks | null {
  if (!plan) return null;
  const coaching = plan.coachings[0] ?? null;
  const fromPlan = formationsFromActionPlan(
    plan.items.filter((i) => i.kind === "formation" || i.kind === "micro_formation"),
  );
  const fromNeeds = matchParcoursForKeywords(plan.needs);
  const microFormations = [...fromPlan, ...fromNeeds]
    .filter((f, i, arr) => arr.findIndex((x) => x.slug === f.slug) === i)
    .slice(0, 2);
  const badge = plan.items.find((i) => i.kind === "badge") ?? null;
  return { coaching, microFormations, badge };
}
