import crypto from "node:crypto";
import type {
  AssertionLD,
  BadgeClassLD,
  IssuerProfileLD,
  AssertionVerification,
} from "./types";

const CONTEXT = "https://w3id.org/openbadges/v2" as const;

export const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const buildIssuerProfile = (params: {
  id: string;
  name: string;
  url?: string;
  email?: string;
  description?: string | null;
  image?: string | null;
  publicKey?: IssuerProfileLD["publicKey"];
}): IssuerProfileLD => ({
  "@context": CONTEXT,
  id: params.id,
  type: "Issuer",
  name: params.name,
  url: params.url,
  email: params.email,
  description: params.description ?? undefined,
  image: params.image ?? undefined,
  publicKey: params.publicKey,
});

export const buildBadgeClass = (params: {
  id: string;
  name: string;
  description: string;
  image: string;
  issuerId: string;
  criteriaUrl?: string | null;
  criteriaText?: string | null;
  criteriaMarkdown?: string | null;
  alignment?: Array<Record<string, unknown>> | null;
  tags?: string[] | null;
  version?: string | number | null;
}): BadgeClassLD => ({
  "@context": CONTEXT,
  id: params.id,
  type: "BadgeClass",
  name: params.name,
  description: params.description,
  image: params.image,
  issuer: params.issuerId,
  criteria: params.criteriaUrl
    ? {
        id: params.criteriaUrl,
        narrative: params.criteriaMarkdown ?? params.criteriaText ?? "",
      }
    : {
        narrative: params.criteriaMarkdown ?? params.criteriaText ?? "",
      },
  alignment: params.alignment ?? undefined,
  tags: params.tags ?? undefined,
  version: params.version != null ? String(params.version) : undefined,
});

export const buildBadgeClassJsonLd = (params: {
  baseUrl: string;
  badgeClass: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string | null;
    imageTemplateUrl: string;
    issuerId: string;
    criteriaUrl?: string | null;
    criteriaText?: string | null;
    criteriaMarkdown?: string | null;
    alignment?: unknown;
    tags?: string[] | null;
    version?: string | number | null;
  };
}) => {
  const baseUrl = params.baseUrl.replace(/\/$/, "");
  const badge = params.badgeClass;
  return buildBadgeClass({
    id: `${baseUrl}/api/public/badgeclasses/${badge.id}`,
    name: badge.name,
    description: badge.description,
    image: badge.imageUrl ?? badge.imageTemplateUrl,
    issuerId: `${baseUrl}/api/public/issuers/${badge.issuerId}`,
    criteriaUrl: badge.criteriaUrl ?? null,
    criteriaText: badge.criteriaText ?? null,
    criteriaMarkdown: badge.criteriaMarkdown ?? null,
    alignment: (badge.alignment as Array<Record<string, unknown>> | null) ?? null,
    tags: badge.tags ?? null,
    version: badge.version ?? null,
  });
};

export const buildAssertion = (params: {
  id: string;
  badgeClassId: string;
  issuerId: string;
  recipientEmail: string;
  recipientSalt: string;
  issuedOn: Date | string;
  expires?: Date | string | null;
  evidenceUrls?: string[];
  narrative?: string | null;
  verification: AssertionVerification;
  version?: string | number | null;
  revoked?: boolean;
  revocationReason?: string | null;
}): AssertionLD => {
  const identity = `sha256$${sha256Hex(`${params.recipientEmail}${params.recipientSalt}`)}`;
  return {
    "@context": CONTEXT,
    id: params.id,
    type: "Assertion",
    recipient: {
      identity,
      type: "email",
      hashed: true,
      salt: params.recipientSalt,
    },
    issuedOn:
      typeof params.issuedOn === "string"
        ? params.issuedOn
        : params.issuedOn.toISOString(),
    expires:
      params.expires == null
        ? undefined
        : typeof params.expires === "string"
          ? params.expires
          : params.expires.toISOString(),
    badge: params.badgeClassId,
    issuer: params.issuerId,
    verification: params.verification,
    evidence: params.evidenceUrls?.map((url) => ({ id: url })),
    narrative: params.narrative ?? undefined,
    revoked: params.revoked,
    revocationReason: params.revocationReason ?? undefined,
    version: params.version != null ? String(params.version) : undefined,
  };
};
