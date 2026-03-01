const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export const validateIssuer = (issuer: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  if (issuer["@context"] !== "https://w3id.org/openbadges/v2") errors.push("issuer.@context");
  if (typeof issuer.id !== "string" || !isValidUrl(issuer.id)) errors.push("issuer.id");
  if (issuer.type !== "Issuer") errors.push("issuer.type");
  if (typeof issuer.name !== "string") errors.push("issuer.name");
  return { ok: errors.length === 0, errors };
};

export const validateBadgeClass = (badge: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  if (badge["@context"] !== "https://w3id.org/openbadges/v2") errors.push("badge.@context");
  if (typeof badge.id !== "string" || !isValidUrl(badge.id)) errors.push("badge.id");
  if (badge.type !== "BadgeClass") errors.push("badge.type");
  if (typeof badge.name !== "string") errors.push("badge.name");
  if (typeof badge.description !== "string") errors.push("badge.description");
  if (typeof badge.image !== "string" || !isValidUrl(badge.image)) errors.push("badge.image");
  if (typeof badge.issuer !== "string" || !isValidUrl(badge.issuer)) errors.push("badge.issuer");
  return { ok: errors.length === 0, errors };
};

export const validateAssertion = (assertion: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  if (assertion["@context"] !== "https://w3id.org/openbadges/v2") errors.push("assertion.@context");
  if (typeof assertion.id !== "string" || !isValidUrl(assertion.id)) errors.push("assertion.id");
  if (assertion.type !== "Assertion") errors.push("assertion.type");
  if (typeof assertion.badge !== "string" || !isValidUrl(assertion.badge)) errors.push("assertion.badge");
  if (typeof assertion.issuer !== "string" || !isValidUrl(assertion.issuer)) errors.push("assertion.issuer");
  if (!assertion.recipient) errors.push("assertion.recipient");
  if (!assertion.verification) errors.push("assertion.verification");
  return { ok: errors.length === 0, errors };
};
