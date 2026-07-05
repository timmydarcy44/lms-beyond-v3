import type { LearnerCard } from "@/lib/queries/apprenant";

export type EdgeOnlineFilterChip = {
  id: string;
  label: string;
  keywords: string[];
};

export const EDGE_ONLINE_FILTER_CHIPS: EdgeOnlineFilterChip[] = [
  { id: "all", label: "Toutes", keywords: [] },
  { id: "ia", label: "IA", keywords: ["ia", "intelligence artificielle", "automatisation", "chatgpt", "machine learning"] },
  { id: "commercial", label: "Commercial", keywords: ["commercial", "vente", "prospection", "négociation", "business development"] },
  { id: "management", label: "Management", keywords: ["management", "leadership", "équipe", "manager"] },
  { id: "leadership", label: "Leadership", keywords: ["leadership", "influence", "direction"] },
  { id: "communication", label: "Communication", keywords: ["communication", "storytelling", "présentation", "prise de parole"] },
  { id: "marketing", label: "Marketing", keywords: ["marketing", "growth", "content", "brand"] },
  { id: "sport", label: "Sport", keywords: ["sport", "ntc", "athlète"] },
  { id: "immobilier", label: "Immobilier", keywords: ["immobilier", "real estate"] },
  { id: "rh", label: "RH", keywords: ["rh", "recrutement", "marque employeur", "talent"] },
  { id: "soft-skills", label: "Soft Skills", keywords: ["soft skills", "émotionnel", "comportement", "intelligence émotionnelle"] },
  { id: "automation", label: "Automatisation", keywords: ["automatisation", "automation", "workflow", "zapier", "n8n"] },
  { id: "productivity", label: "Productivité", keywords: ["productivité", "temps", "organisation", "efficacité"] },
];

function cardSearchBlob(card: LearnerCard): string {
  return [
    card.title,
    card.category,
    card.category_name,
    card.presentation,
    card.meta,
    card.level,
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function filterLearnerCards(
  cards: LearnerCard[],
  chipId: string,
  searchQuery: string,
): LearnerCard[] {
  const q = searchQuery
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  const chip = EDGE_ONLINE_FILTER_CHIPS.find((c) => c.id === chipId) ?? EDGE_ONLINE_FILTER_CHIPS[0];

  return cards.filter((card) => {
    const blob = cardSearchBlob(card);
    const matchesSearch = !q || blob.includes(q);
    if (!matchesSearch) return false;
    if (chip.id === "all" || !chip.keywords.length) return true;
    return chip.keywords.some((kw) => blob.includes(kw));
  });
}

export function filterThematicRows(
  rows: { title: string; items: LearnerCard[] }[],
  chipId: string,
  searchQuery: string,
): { title: string; items: LearnerCard[] }[] {
  return rows
    .map((row) => ({
      title: row.title,
      items: filterLearnerCards(row.items, chipId, searchQuery),
    }))
    .filter((row) => row.items.length > 0);
}
