import type { SupabaseClient } from "@supabase/supabase-js";

export const RISK_STATUSES = ["open", "monitoring", "mitigated", "closed"] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: "Ouvert",
  monitoring: "Sous surveillance",
  mitigated: "Maîtrisé",
  closed: "Clos",
};

export type QualiopiRiskRow = {
  id: string;
  label: string;
  cause: string | null;
  probability: number;
  severity: number;
  criticality: number;
  preventive_action: string | null;
  owner_name: string | null;
  due_at: string | null;
  reviewed_at: string | null;
  status: RiskStatus;
  action_id: string | null;
  reclamation_id: string | null;
  highlight_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function clampScore(n: unknown, fallback = 1): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.min(4, Math.max(1, v));
}

export function computeCriticality(probability: number, severity: number): number {
  return clampScore(probability) * clampScore(severity);
}

export function parseRiskStatus(v: unknown): RiskStatus | null {
  const s = String(v ?? "").trim().toLowerCase();
  // Accept French labels from CSV
  const map: Record<string, RiskStatus> = {
    open: "open",
    ouvert: "open",
    monitoring: "monitoring",
    surveillance: "monitoring",
    "sous surveillance": "monitoring",
    mitigated: "mitigated",
    maitrise: "mitigated",
    maîtrisé: "mitigated",
    maitrisee: "mitigated",
    closed: "closed",
    clos: "closed",
    cloture: "closed",
    clôturé: "closed",
  };
  return map[s] ?? ((RISK_STATUSES as readonly string[]).includes(s) ? (s as RiskStatus) : null);
}

export function criticalityBand(c: number): "faible" | "modere" | "eleve" | "critique" {
  if (c >= 12) return "critique";
  if (c >= 8) return "eleve";
  if (c >= 4) return "modere";
  return "faible";
}

export const CRITICALITY_BAND_LABELS = {
  faible: "Faible",
  modere: "Modéré",
  eleve: "Élevé",
  critique: "Critique",
} as const;

export async function listQualiopiRisks(
  service: SupabaseClient,
): Promise<QualiopiRiskRow[]> {
  const { data, error } = await service
    .from("crm_qualiopi_risks")
    .select(
      "id, label, cause, probability, severity, criticality, preventive_action, owner_name, due_at, reviewed_at, status, action_id, reclamation_id, highlight_id, notes, created_at, updated_at",
    )
    .order("criticality", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(500);
  if (error) {
    if (/crm_qualiopi_risks|schema cache|does not exist/i.test(error.message)) return [];
    console.warn("[risks] list:", error.message);
    return [];
  }
  return (data ?? []).map(normalizeRiskRow);
}

function normalizeRiskRow(r: Record<string, unknown>): QualiopiRiskRow {
  const status = parseRiskStatus(r.status) ?? "open";
  const probability = clampScore(r.probability);
  const severity = clampScore(r.severity);
  return {
    id: String(r.id),
    label: String(r.label ?? ""),
    cause: r.cause ? String(r.cause) : null,
    probability,
    severity,
    criticality: Number(r.criticality) || computeCriticality(probability, severity),
    preventive_action: r.preventive_action ? String(r.preventive_action) : null,
    owner_name: r.owner_name ? String(r.owner_name) : null,
    due_at: r.due_at ? String(r.due_at).slice(0, 10) : null,
    reviewed_at: r.reviewed_at ? String(r.reviewed_at).slice(0, 10) : null,
    status,
    action_id: r.action_id ? String(r.action_id) : null,
    reclamation_id: r.reclamation_id ? String(r.reclamation_id) : null,
    highlight_id: r.highlight_id ? String(r.highlight_id) : null,
    notes: r.notes ? String(r.notes) : null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

export type RiskInput = {
  label: string;
  cause?: string | null;
  probability?: number;
  severity?: number;
  preventive_action?: string | null;
  owner_name?: string | null;
  due_at?: string | null;
  reviewed_at?: string | null;
  status?: RiskStatus;
  action_id?: string | null;
  reclamation_id?: string | null;
  highlight_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
};

export function buildRiskPatch(input: RiskInput): Record<string, unknown> {
  const probability = clampScore(input.probability ?? 1);
  const severity = clampScore(input.severity ?? 1);
  return {
    label: input.label.trim(),
    cause: input.cause?.trim() || null,
    probability,
    severity,
    criticality: computeCriticality(probability, severity),
    preventive_action: input.preventive_action?.trim() || null,
    owner_name: input.owner_name?.trim() || null,
    due_at: input.due_at ? String(input.due_at).slice(0, 10) : null,
    reviewed_at: input.reviewed_at ? String(input.reviewed_at).slice(0, 10) : null,
    status: input.status ?? "open",
    action_id: input.action_id || null,
    reclamation_id: input.reclamation_id || null,
    highlight_id: input.highlight_id || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function createQualiopiRisk(
  service: SupabaseClient,
  input: RiskInput,
): Promise<{ ok: true; risk: QualiopiRiskRow } | { ok: false; error: string }> {
  const label = String(input.label ?? "").trim();
  if (label.length < 3) return { ok: false, error: "Libellé trop court" };
  const patch = buildRiskPatch({ ...input, label });
  if (input.created_by) patch.created_by = input.created_by;

  const { data, error } = await service
    .from("crm_qualiopi_risks")
    .insert(patch)
    .select(
      "id, label, cause, probability, severity, criticality, preventive_action, owner_name, due_at, reviewed_at, status, action_id, reclamation_id, highlight_id, notes, created_at, updated_at",
    )
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message || "Création impossible" };
  return { ok: true, risk: normalizeRiskRow(data as Record<string, unknown>) };
}

export async function updateQualiopiRisk(
  service: SupabaseClient,
  id: string,
  input: Partial<RiskInput> & { label?: string },
): Promise<{ ok: true; risk: QualiopiRiskRow } | { ok: false; error: string }> {
  const { data: existing } = await service
    .from("crm_qualiopi_risks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Risque introuvable" };

  const merged: RiskInput = {
    label: input.label ?? String(existing.label),
    cause: input.cause !== undefined ? input.cause : existing.cause,
    probability: input.probability ?? Number(existing.probability),
    severity: input.severity ?? Number(existing.severity),
    preventive_action:
      input.preventive_action !== undefined
        ? input.preventive_action
        : existing.preventive_action,
    owner_name: input.owner_name !== undefined ? input.owner_name : existing.owner_name,
    due_at: input.due_at !== undefined ? input.due_at : existing.due_at,
    reviewed_at: input.reviewed_at !== undefined ? input.reviewed_at : existing.reviewed_at,
    status: input.status ?? (parseRiskStatus(existing.status) ?? "open"),
    action_id: input.action_id !== undefined ? input.action_id : existing.action_id,
    reclamation_id:
      input.reclamation_id !== undefined ? input.reclamation_id : existing.reclamation_id,
    highlight_id:
      input.highlight_id !== undefined ? input.highlight_id : existing.highlight_id,
    notes: input.notes !== undefined ? input.notes : existing.notes,
  };

  const patch = buildRiskPatch(merged);
  const { data, error } = await service
    .from("crm_qualiopi_risks")
    .update(patch)
    .eq("id", id)
    .select(
      "id, label, cause, probability, severity, criticality, preventive_action, owner_name, due_at, reviewed_at, status, action_id, reclamation_id, highlight_id, notes, created_at, updated_at",
    )
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message || "Mise à jour impossible" };
  return { ok: true, risk: normalizeRiskRow(data as Record<string, unknown>) };
}

/** Crée une action PAQ liée et rattache le risque. */
export async function linkRiskToPaqAction(
  service: SupabaseClient,
  riskId: string,
): Promise<{ ok: true; actionId: string } | { ok: false; error: string }> {
  const { data: risk } = await service
    .from("crm_qualiopi_risks")
    .select("id, label, cause, preventive_action, owner_name, due_at, action_id")
    .eq("id", riskId)
    .maybeSingle();
  if (!risk) return { ok: false, error: "Risque introuvable" };
  if (risk.action_id) return { ok: true, actionId: String(risk.action_id) };

  const { data: action, error } = await service
    .from("crm_qualiopi_actions")
    .insert({
      title: `Risque : ${risk.label}`,
      cause: risk.cause || risk.preventive_action || null,
      owner_name: risk.owner_name || null,
      due_at: risk.due_at || null,
      source: "risque",
      status: "todo",
    })
    .select("id")
    .maybeSingle();
  if (error || !action?.id) {
    return { ok: false, error: error?.message || "Création action PAQ impossible" };
  }

  await service
    .from("crm_qualiopi_risks")
    .update({ action_id: action.id, updated_at: new Date().toISOString() })
    .eq("id", riskId);

  return { ok: true, actionId: String(action.id) };
}

export type CsvRiskDraft = {
  label: string;
  cause: string | null;
  probability: number;
  severity: number;
  preventive_action: string | null;
  owner_name: string | null;
  due_at: string | null;
  status: RiskStatus;
};

function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const direct = row[k];
    if (direct != null && String(direct).trim()) return String(direct).trim();
    const found = Object.entries(row).find(
      ([key]) => key.trim().toLowerCase() === k.toLowerCase(),
    );
    if (found && String(found[1] ?? "").trim()) return String(found[1]).trim();
  }
  return "";
}

/** Parse une ligne CSV (clés FR ou EN). */
export function mapCsvRowToRisk(row: Record<string, unknown>): CsvRiskDraft | null {
  const label = pickField(row, ["libelle", "libellé", "label", "titre", "risque"]);
  if (label.length < 3) return null;
  const statusRaw = pickField(row, ["statut", "status"]);
  return {
    label,
    cause: pickField(row, ["cause", "origine"]) || null,
    probability: clampScore(
      pickField(row, ["probabilite", "probabilité", "probability", "p"]) || 1,
    ),
    severity: clampScore(
      pickField(row, ["gravite", "gravité", "severity", "g"]) || 1,
    ),
    preventive_action:
      pickField(row, [
        "action_preventive",
        "action_préventive",
        "preventive_action",
        "action",
      ]) || null,
    owner_name: pickField(row, ["responsable", "owner", "owner_name"]) || null,
    due_at: (pickField(row, ["echeance", "échéance", "due_at", "due"]) || "").slice(0, 10) || null,
    status: parseRiskStatus(statusRaw) ?? "open",
  };
}

export async function importRisksFromCsvRows(
  service: SupabaseClient,
  rows: Record<string, unknown>[],
  actorUserId?: string | null,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const draft = mapCsvRowToRisk(rows[i] ?? {});
    if (!draft) {
      skipped += 1;
      continue;
    }
    const result = await createQualiopiRisk(service, {
      ...draft,
      created_by: actorUserId ?? null,
    });
    if (result.ok) imported += 1;
    else {
      skipped += 1;
      errors.push(`Ligne ${i + 2}: ${result.error}`);
    }
  }
  return { imported, skipped, errors: errors.slice(0, 20) };
}
