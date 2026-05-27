/** Message LinkedIn pré-rempli pour un Open Badge EDGE obtenu. */
export function buildOpenBadgeLinkedInShareMessage(params: {
  badgeName: string;
  level?: number | null;
}): string {
  const name = params.badgeName.trim() || "Open Badge";
  const level =
    typeof params.level === "number" && Number.isFinite(params.level)
      ? ` de niveau ${params.level}`
      : "";
  return `Bonjour à tous,\nJe suis fièr(e) de vous annoncer que j'ai obtenu(e) l'open badge ${name}${level} de la EDGE.`;
}

export function buildOpenBadgeLinkedInShareUrl(params: {
  shareUrl: string;
  badgeName: string;
  level?: number | null;
}): string {
  const url = params.shareUrl.trim();
  const summary = buildOpenBadgeLinkedInShareMessage(params);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(summary)}`;
}

/** Ouvre le composer LinkedIn avec le texte (meilleur préremplissage que share-offsite seul). */
export function buildOpenBadgeLinkedInFeedShareUrl(params: {
  shareUrl: string;
  badgeName: string;
  level?: number | null;
}): string {
  const url = params.shareUrl.trim();
  const message = `${buildOpenBadgeLinkedInShareMessage(params)}\n\n${url}`;
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(message)}`;
}
