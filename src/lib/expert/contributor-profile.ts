export const CONTRIBUTOR_ROLES = ["expert", "formateur"] as const;

export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number];

export const CONTRIBUTOR_ROLE_LABELS: Record<ContributorRole, string> = {
  expert: "Expert",
  formateur: "Formateur",
};

export const CONTRIBUTOR_ROLE_HELP: Record<ContributorRole, string> = {
  expert: "Valide uniquement des open badges.",
  formateur: "Donne des cours : présentiel, vidéos, visio.",
};

const ROLE_SET = new Set<string>(CONTRIBUTOR_ROLES);

export function isContributorRole(value: string): value is ContributorRole {
  return ROLE_SET.has(value);
}

export function contributorDisplayName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const first = String(firstName ?? "").trim();
  const last = String(lastName ?? "").trim().toLocaleUpperCase("fr-FR");
  return [first, last].filter(Boolean).join(" ");
}

export function parseContributorProfile(references: unknown, headline?: string | null): {
  roles: ContributorRole[];
  jobTitle: string;
  companyLogoUrl: string | null;
} {
  const entry = Array.isArray(references)
    ? references.find(
        (item) => item && typeof item === "object" && (item as { _type?: string })._type === "cfa_contributor",
      )
    : null;
  const record =
    entry && typeof entry === "object"
      ? (entry as { roles?: unknown; job_title?: unknown; company_logo_url?: unknown })
      : null;
  const roles = Array.isArray(record?.roles)
    ? record.roles.map((role) => String(role)).filter(isContributorRole)
    : [];
  const storedTitle = String(record?.job_title ?? "").trim();
  const companyLogoUrl = String(record?.company_logo_url ?? "").trim() || null;
  return {
    roles,
    jobTitle: storedTitle || String(headline ?? "").trim(),
    companyLogoUrl,
  };
}

export function withContributorProfile(
  references: unknown,
  profile: { roles: ContributorRole[]; jobTitle: string; companyLogoUrl?: string | null },
): unknown[] {
  const kept = Array.isArray(references)
    ? references.filter(
        (item) => !(item && typeof item === "object" && (item as { _type?: string })._type === "cfa_contributor"),
      )
    : [];
  kept.push({
    _type: "cfa_contributor",
    roles: profile.roles,
    job_title: profile.jobTitle,
    company_logo_url: profile.companyLogoUrl || null,
  });
  return kept;
}
