import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";

/**
 * URL publique devis/convention.
 * Toujours www.byound.fr (pas edgebs / APP_URL) pour que le CTA mail
 * tombe sur le déploiement Next qui porte /doc.
 */
export function formationDocumentPublicUrl(
  accessToken: string,
  acceptToken?: string | null,
): string {
  const q = new URLSearchParams({ token: accessToken });
  if (acceptToken) q.set("accept", String(acceptToken));
  return `${BYOUND_PUBLIC_ORIGIN}/doc?${q.toString()}`;
}
