const COMMERCIAL_KEYS = [
  "contact_owner_email",
  "siret",
  "siren",
  "naf_code",
  "opco_name",
  "sector",
  "employee_count",
  "location",
  "priority",
  "why_target",
  "training_needs",
  "contact_role",
  "contact_linkedin",
  "company_linkedin",
  "approach_channel",
  "decision_maker_identified",
  "engagement_score",
  "last_contact_date",
  "next_action",
  "next_action_date",
  "estimated_budget",
  "estimated_users",
] as const;

/** Fusionne les champs qualification BTOB depuis un body API (create ou patch). */
export function applyCommercialFieldsFromBody(
  target: Record<string, unknown>,
  body: Record<string, unknown> | null,
  options?: { partial?: boolean },
): void {
  if (!body) return;
  const partial = options?.partial ?? false;

  for (const key of COMMERCIAL_KEYS) {
    if (partial && body[key] === undefined) continue;
    if (!partial && body[key] === undefined) continue;

    if (key === "siret") {
      const digits = String(body.siret ?? "").replace(/\s/g, "");
      target.siret = digits.length === 14 ? digits : null;
    } else if (key === "siren") {
      const digits = String(body.siren ?? "").replace(/\s/g, "");
      target.siren = digits.length === 9 ? digits : null;
    } else if (key === "training_needs") {
      target.training_needs = Array.isArray(body.training_needs)
        ? body.training_needs.map((n) => String(n).trim()).filter(Boolean)
        : [];
    } else if (key === "decision_maker_identified") {
      target.decision_maker_identified = Boolean(body.decision_maker_identified);
    } else if (key === "engagement_score") {
      const n = Number(body.engagement_score);
      target.engagement_score = Number.isFinite(n) ? Math.min(3, Math.max(0, Math.round(n))) : 0;
    } else if (key === "estimated_users") {
      const n = Number(body.estimated_users);
      target.estimated_users = Number.isFinite(n) ? Math.round(n) : null;
    } else if (body[key] === null || body[key] === "") {
      target[key] = null;
    } else {
      target[key] = String(body[key]).trim();
    }
  }
}
