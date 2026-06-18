import type { EnterpriseTestKind } from "@/lib/entreprise/enterprise-share-consent";
import { buildPostTestRedirectUrl } from "@/lib/entreprise/enterprise-share-consent";

/** Après un test salarié : redirige vers l'overlay RGPD entreprise si rattaché à une org. */
export async function redirectAfterSalarieAssessmentTest(
  test: EnterpriseTestKind,
  defaultNext = "/dashboard/salarie",
): Promise<string> {
  try {
    const res = await fetch("/api/dashboard/apprenant/org-context", { credentials: "include" });
    if (!res.ok) return defaultNext;
    const json = (await res.json()) as { has_organisation?: boolean };
    return buildPostTestRedirectUrl(test, defaultNext, Boolean(json.has_organisation), "salarie");
  } catch {
    return defaultNext;
  }
}
