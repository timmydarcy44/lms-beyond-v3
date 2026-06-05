import type { EnterpriseTestKind } from "@/lib/entreprise/enterprise-share-consent";
import { buildPostTestRedirectUrl } from "@/lib/entreprise/enterprise-share-consent";

/** Après un test : redirige vers l'overlay RGPD si le collaborateur est rattaché à une entreprise. */
export async function redirectAfterAssessmentTest(
  test: EnterpriseTestKind,
  defaultNext: string,
): Promise<string> {
  try {
    const res = await fetch("/api/dashboard/apprenant/org-context", { credentials: "include" });
    if (!res.ok) return defaultNext;
    const json = (await res.json()) as { has_organisation?: boolean };
    return buildPostTestRedirectUrl(test, defaultNext, Boolean(json.has_organisation));
  } catch {
    return defaultNext;
  }
}
