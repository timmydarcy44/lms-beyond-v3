/** Formatage des erreurs API Mission EDGE (détail en dev). */

export type MissionApiErrorPayload = {
  error: string;
  code?: string;
  details?: string;
  missing?: string[];
  status?: number;
};

export function formatMissionApiError(
  json: Record<string, unknown>,
  status: number,
): string {
  const base = String(json.error ?? "Erreur inconnue");
  if (process.env.NODE_ENV === "production") return base;

  const parts = [`[${status}] ${base}`];
  if (json.code) parts.push(`code: ${String(json.code)}`);
  if (json.details) parts.push(`détails: ${String(json.details)}`);
  if (Array.isArray(json.missing) && json.missing.length) {
    parts.push(`champs manquants: ${json.missing.join(", ")}`);
  }
  if (json.hint) parts.push(`hint: ${String(json.hint)}`);
  return parts.join(" · ");
}

export function missionApiErrorResponse(
  status: number,
  payload: MissionApiErrorPayload,
): MissionApiErrorPayload & { error: string; status: number } {
  const body = { ...payload, status };
  if (process.env.NODE_ENV !== "production") {
    return body;
  }
  return { error: payload.error, status };
}
