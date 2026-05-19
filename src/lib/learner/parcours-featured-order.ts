import type { LearnerCard } from "@/lib/queries/apprenant";

/** Parcours mis en avant : Titre Pro / NTC / négociateur technico-commercial en premier. */
export function isFeaturedNtcParcours(card: LearnerCard): boolean {
  const blob = `${card.title ?? ""} ${card.slug ?? ""} ${card.href ?? ""}`.toLowerCase();
  return (
    blob.includes("ntc") ||
    blob.includes("négociateur technico-commercial") ||
    blob.includes("negociateur technico-commercial") ||
    blob.includes("négociateur technico commercial") ||
    blob.includes("negociateur technico commercial") ||
    blob.includes("technico-commercial") ||
    blob.includes("technico commercial")
  );
}

export function orderParcoursWithFeaturedFirst(list: LearnerCard[]): LearnerCard[] {
  const arr = Array.isArray(list) ? [...list] : [];
  arr.sort((a, b) => {
    const fa = isFeaturedNtcParcours(a);
    const fb = isFeaturedNtcParcours(b);
    if (fa !== fb) return fa ? -1 : 1;
    return 0;
  });
  return arr;
}
