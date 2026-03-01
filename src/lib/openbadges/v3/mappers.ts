import type { AssertionLD } from "../v2/types";
import type { VerifiableCredential } from "./types";

export const v2AssertionToV3Credential = (_assertion: AssertionLD): VerifiableCredential => {
  return {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/openbadges/v3",
    ],
    id: "",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: "",
    issuanceDate: new Date().toISOString(),
    credentialSubject: {},
  };
};
