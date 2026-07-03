export type ExpertDocumentMeta = {
  id: string;
  name: string;
  category: string;
  url: string;
  mime_type?: string | null;
  size?: number | null;
  uploaded_at: string;
  version?: number | null;
};

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
  bio_long?: string | null;
  website_url?: string | null;
  daily_rate?: number | null;
  documents?: ExpertDocumentMeta[];
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
    bio_long: typeof raw.bio_long === "string" ? raw.bio_long : null,
    website_url: typeof raw.website_url === "string" ? raw.website_url : null,
    daily_rate: typeof raw.daily_rate === "number" ? raw.daily_rate : null,
    documents: Array.isArray(raw.documents)
      ? (raw.documents as ExpertDocumentMeta[]).filter((d) => d && typeof d.id === "string")
      : [],
  };
}

export function computeProfileCompletion(fields: {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  formats?: string[];
  domains?: string[];
  zones?: string[];
  languages?: string[];
}): number {
  const checks = [
    Boolean(fields.firstName?.trim() && fields.lastName?.trim()),
    Boolean(fields.headline?.trim()),
    Boolean(fields.bio?.trim()),
    Boolean(fields.avatarUrl?.trim()),
    (fields.specialties?.length ?? 0) > 0 || (fields.domains?.length ?? 0) > 0,
    (fields.formats?.length ?? 0) > 0,
    (fields.zones?.length ?? 0) > 0,
    (fields.languages?.length ?? 0) > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
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
