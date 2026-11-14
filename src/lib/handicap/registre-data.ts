import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accommodationCategoryLabel } from "@/lib/handicap/case-types";

const PARTNER_LABEL: Record<string, string> = {
  agefiph: "Agefiph",
  cap_emploi: "Cap emploi",
  medecin_travail: "Médecin du travail",
  autre: "Autre",
};

export type RegistreRow = {
  /** Identifiant anonymisé — jamais le nom. */
  dossierCode: string;
  caseId: string;
  requestDate: string;
  pathType: "Business" | "CFA";
  accommodationCategories: string[];
  actionsDone: number;
  actionsTotal: number;
  partners: string[];
  closedAt: string | null;
  status: string;
};

export function anonymizedDossierCode(caseId: string): string {
  const h = createHash("sha256").update(`disability-registre:${caseId}`).digest("hex");
  return `DH-${h.slice(0, 6).toUpperCase()}`;
}

export async function loadDisabilityRegistre(
  service: SupabaseClient,
): Promise<RegistreRow[]> {
  const { data: cases } = await service
    .from("disability_cases")
    .select("id, scope, status, created_at, closed_at, cfa_application_id")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = cases ?? [];
  if (!rows.length) return [];

  const caseIds = rows.map((c) => String(c.id));
  const [{ data: accommodations }, { data: actions }, { data: partners }] =
    await Promise.all([
      service
        .from("disability_accommodations")
        .select("case_id, category")
        .in("case_id", caseIds),
      service
        .from("disability_actions")
        .select("case_id, status")
        .in("case_id", caseIds),
      service
        .from("disability_partners")
        .select("case_id, partner")
        .in("case_id", caseIds),
    ]);

  const catsByCase = new Map<string, Set<string>>();
  for (const a of accommodations ?? []) {
    const cid = String(a.case_id);
    const set = catsByCase.get(cid) ?? new Set();
    set.add(accommodationCategoryLabel(String(a.category)));
    catsByCase.set(cid, set);
  }

  const actionsByCase = new Map<string, { done: number; total: number }>();
  for (const a of actions ?? []) {
    const cid = String(a.case_id);
    const cur = actionsByCase.get(cid) ?? { done: 0, total: 0 };
    cur.total += 1;
    if (a.status === "done") cur.done += 1;
    actionsByCase.set(cid, cur);
  }

  const partnersByCase = new Map<string, Set<string>>();
  for (const p of partners ?? []) {
    const cid = String(p.case_id);
    const set = partnersByCase.get(cid) ?? new Set();
    set.add(PARTNER_LABEL[String(p.partner)] ?? String(p.partner));
    partnersByCase.set(cid, set);
  }

  return rows.map((c) => {
    const id = String(c.id);
    const acts = actionsByCase.get(id) ?? { done: 0, total: 0 };
    const isSchool = c.scope === "school" || Boolean(c.cfa_application_id);
    return {
      dossierCode: anonymizedDossierCode(id),
      caseId: id,
      requestDate: String(c.created_at),
      pathType: isSchool ? "CFA" : "Business",
      accommodationCategories: Array.from(catsByCase.get(id) ?? []),
      actionsDone: acts.done,
      actionsTotal: acts.total,
      partners: Array.from(partnersByCase.get(id) ?? []),
      closedAt: c.closed_at ? String(c.closed_at) : null,
      status: String(c.status),
    };
  });
}
