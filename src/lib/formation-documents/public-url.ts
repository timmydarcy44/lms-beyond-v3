import { appOrigin } from "@/lib/formation-documents/context";

/** URL publique devis/convention (évite /d/[token] cassé en prod Vercel). */
export function formationDocumentPublicUrl(
  accessToken: string,
  acceptToken?: string | null,
): string {
  const q = new URLSearchParams({ token: accessToken });
  if (acceptToken) q.set("accept", String(acceptToken));
  return `${appOrigin()}/doc?${q.toString()}`;
}
