export type OpenBadgesContext = "https://w3id.org/openbadges/v2";

export type IssuerProfileLD = {
  "@context": OpenBadgesContext;
  id: string;
  type: "Issuer";
  name: string;
  url?: string;
  email?: string;
  description?: string;
  image?: string;
  publicKey?: Array<{
    id: string;
    type: string;
    publicKeyPem?: string;
    publicKeyJwk?: Record<string, unknown>;
  }>;
};

export type BadgeClassLD = {
  "@context": OpenBadgesContext;
  id: string;
  type: "BadgeClass";
  name: string;
  description: string;
  image: string;
  criteria: {
    id?: string;
    narrative?: string;
  };
  issuer: string;
  alignment?: Array<Record<string, unknown>>;
  tags?: string[];
  version?: string;
};

export type AssertionRecipient = {
  identity: string;
  type: "email" | "url";
  hashed: boolean;
  salt: string;
};

export type AssertionVerification =
  | {
      type: "hosted";
      url: string;
    }
  | {
      type: "signed";
      creator: string;
      signature: string;
    };

export type AssertionLD = {
  "@context": OpenBadgesContext;
  id: string;
  type: "Assertion";
  recipient: AssertionRecipient;
  issuedOn: string;
  expires?: string;
  badge: string;
  issuer: string;
  verification: AssertionVerification;
  evidence?: Array<{ id: string; narrative?: string }>;
  narrative?: string;
  revoked?: boolean;
  revokedAt?: string;
  revocationReason?: string;
  version?: string;
};
