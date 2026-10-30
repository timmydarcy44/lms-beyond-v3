/** Message LinkedIn pré-rempli pour un Open Badge Byound obtenu. */
export function buildOpenBadgeLinkedInShareMessage(params: {
  badgeName: string;
  level?: number | null;
}): string {
  const name = String(params.badgeName ?? "").trim() || "Open Badge";
  return `J'ai obtenu l'Open Badge « ${name} » délivré par Byound.`;
}

export function buildOpenBadgeLinkedInShareUrl(params: {
  shareUrl: string;
  badgeName: string;
  level?: number | null;
}): string {
  const url = String(params.shareUrl ?? "").trim() || "https://www.byound.fr";
  const summary = buildOpenBadgeLinkedInShareMessage(params);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(summary)}`;
}

/** Ouvre le composer LinkedIn avec le texte (meilleur préremplissage que share-offsite seul). */
export function buildOpenBadgeLinkedInFeedShareUrl(params: {
  shareUrl: string;
  badgeName: string;
  level?: number | null;
}): string {
  const url = String(params.shareUrl ?? "").trim() || "https://www.byound.fr";
  const message = `${buildOpenBadgeLinkedInShareMessage(params)}\n\n${url}`;
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(message)}`;
}
