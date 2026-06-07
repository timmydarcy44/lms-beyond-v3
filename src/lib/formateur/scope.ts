import {
  JESSICA_CONTENTIN_EMAIL,
  JESSICA_STUDIO_ORG_ID,
} from "@/lib/jessica-contentin/studio-config";

/** Super-admins avec accès catalogue LMS global (Beyond). */
const FULL_CATALOG_SUPER_ADMIN_EMAILS = new Set([
  "timmydarcy44@gmail.com",
  "timdarcypro@gmail.com",
]);

export type FormateurScope = {
  userId: string;
  email: string | null;
  /** Lecture catalogue complet (toutes orgs). */
  fullCatalog: boolean;
  /** Filtre org_id ; `null` = pas de filtre (catalogue complet). */
  orgIds: string[] | null;
  /** Org par défaut pour création de contenu. */
  primaryOrgId: string | null;
};

export function resolveFormateurScope(input: {
  userId: string;
  email: string | null | undefined;
  isSuperAdmin: boolean;
  membershipOrgIds: string[];
}): FormateurScope {
  const email = input.email?.trim().toLowerCase() ?? "";

  if (email === JESSICA_CONTENTIN_EMAIL) {
    return {
      userId: input.userId,
      email: email || null,
      fullCatalog: false,
      orgIds: [JESSICA_STUDIO_ORG_ID],
      primaryOrgId: JESSICA_STUDIO_ORG_ID,
    };
  }

  if (input.isSuperAdmin && FULL_CATALOG_SUPER_ADMIN_EMAILS.has(email)) {
    return {
      userId: input.userId,
      email: email || null,
      fullCatalog: true,
      orgIds: null,
      primaryOrgId: input.membershipOrgIds[0] ?? null,
    };
  }

  if (input.isSuperAdmin) {
    const orgIds = input.membershipOrgIds.length ? input.membershipOrgIds : [];
    return {
      userId: input.userId,
      email: email || null,
      fullCatalog: false,
      orgIds,
      primaryOrgId: orgIds[0] ?? null,
    };
  }

  return {
    userId: input.userId,
    email: email || null,
    fullCatalog: false,
    orgIds: input.membershipOrgIds.length ? input.membershipOrgIds : [],
    primaryOrgId: input.membershipOrgIds[0] ?? null,
  };
}
