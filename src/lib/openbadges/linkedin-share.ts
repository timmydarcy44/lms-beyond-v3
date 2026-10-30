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

/** Ajout au profil LinkedIn (certification), pas un partage de fil. */
export function buildLinkedInAddCertificationUrl(params: {
  badgeName: string;
  issuedAt: string;
  certUrl: string;
  certId: string;
  organizationName?: string;
}): string {
  const issued = new Date(params.issuedAt);
  const year = Number.isNaN(issued.getTime()) ? "" : String(issued.getUTCFullYear());
  const month = Number.isNaN(issued.getTime()) ? "" : String(issued.getUTCMonth() + 1);
  const query = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: params.badgeName,
    organizationName: params.organizationName?.trim() || "Byound",
    issueYear: year,
    issueMonth: month,
    certUrl: params.certUrl,
    certId: params.certId,
  });
  return `https://www.linkedin.com/profile/add?${query.toString()}`;
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
