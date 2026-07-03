export type EdgeRegistrationMeta = {
  primary_domain: string | null;
  secondary_domains: string[];
  domains: string[];
  audiences: string[];
  years_experience: string | null;
  geographic_zones: string[];
  languages: string[];
  availabilities: string[];
  photo_url: string | null;
  linkedin_url: string | null;
};

const META_TYPE = "edge_registration_meta";

export function parseRegistrationMeta(references: unknown): EdgeRegistrationMeta | null {
  if (!Array.isArray(references)) return null;
  const raw = references.find(
    (item) => typeof item === "object" && item && (item as { _type?: string })._type === META_TYPE,
  ) as Record<string, unknown> | undefined;
  if (!raw) return null;

  const asStrings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];

  return {
    primary_domain: typeof raw.primary_domain === "string" ? raw.primary_domain : null,
    secondary_domains: asStrings(raw.secondary_domains),
    domains: asStrings(raw.domains),
    audiences: asStrings(raw.audiences),
    years_experience: typeof raw.years_experience === "string" ? raw.years_experience : null,
    geographic_zones: asStrings(raw.geographic_zones),
    languages: asStrings(raw.languages),
    availabilities: asStrings(raw.availabilities),
    photo_url: typeof raw.photo_url === "string" ? raw.photo_url : null,
    linkedin_url: typeof raw.linkedin_url === "string" ? raw.linkedin_url : null,
  };
}

export function mergeRegistrationMeta(
  references: unknown,
  patch: Partial<EdgeRegistrationMeta>,
): unknown[] {
  const list = Array.isArray(references) ? [...references] : [];
  const idx = list.findIndex(
    (item) => typeof item === "object" && item && (item as { _type?: string })._type === META_TYPE,
  );
  const current = idx >= 0 ? (list[idx] as Record<string, unknown>) : { _type: META_TYPE };
  const next = { ...current, ...patch, _type: META_TYPE };
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  return list;
}

export function stripRegistrationMeta(references: unknown): unknown[] {
  if (!Array.isArray(references)) return [];
  return references.filter(
    (item) => !(typeof item === "object" && item && (item as { _type?: string })._type === META_TYPE),
  );
}
