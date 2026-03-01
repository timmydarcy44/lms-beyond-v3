type VerificationResult = {
  ok: boolean;
  reasons: string[];
};

type VerifyOptions = {
  checkRevocations?: boolean;
  revocationListUrl?: string;
  orgId?: string;
  baseUrl?: string;
};

type AssertionCandidate = {
  "@context"?: string | string[];
  id?: string;
  badge?: string;
  issuer?: string;
  recipient?: { identity?: string; hashed?: boolean };
  verification?: { type?: string; url?: string };
  revoked?: boolean;
  revokedAt?: string | null;
  revocationReason?: string | null;
};

const hasContext = (context: AssertionCandidate["@context"]) => {
  const expected = "https://w3id.org/openbadges/v2";
  if (!context) return false;
  if (typeof context === "string") return context === expected;
  return context.includes(expected);
};

export const verifyHostedAssertion = async (
  assertionUrl: string,
  options?: VerifyOptions,
): Promise<VerificationResult> => {
  const reasons: string[] = [];

  let json: AssertionCandidate | null = null;
  try {
    const response = await fetch(assertionUrl, {
      headers: { Accept: "application/ld+json" },
    });
    if (!response.ok) {
      return { ok: false, reasons: [`FETCH_FAILED:${response.status}`] };
    }
    json = (await response.json()) as AssertionCandidate;
  } catch (error) {
    return { ok: false, reasons: ["FETCH_FAILED:NETWORK"] };
  }

  if (!hasContext(json["@context"])) {
    reasons.push("MISSING_CONTEXT");
  }
  if (!json.id) {
    reasons.push("MISSING_ID");
  } else if (json.id !== assertionUrl) {
    reasons.push("ID_MISMATCH");
  }
  if (!json.badge) {
    reasons.push("MISSING_BADGE");
  }
  if (!json.issuer) {
    reasons.push("MISSING_ISSUER");
  }
  if (!json.recipient?.hashed || !json.recipient?.identity) {
    reasons.push("RECIPIENT_NOT_HASHED");
  }
  if (json.verification?.type !== "hosted") {
    reasons.push("INVALID_VERIFICATION_TYPE");
  }
  if (!json.verification?.url || json.verification.url !== json.id) {
    reasons.push("VERIFICATION_URL_MISMATCH");
  }
  if (json.revoked === true || Boolean(json.revokedAt)) {
    reasons.push("REVOKED");
    if (json.revocationReason) {
      reasons.push(`REVOCATION_REASON:${json.revocationReason}`);
    }
  }

  if (!reasons.includes("REVOKED") && options?.checkRevocations) {
    const baseUrl =
      options.baseUrl ?? (() => {
        try {
          return new URL(assertionUrl).origin;
        } catch {
          return undefined;
        }
      })();
    const listUrl =
      options.revocationListUrl ??
      (options.orgId && baseUrl
        ? `${baseUrl}/api/public/organizations/${options.orgId}/revocations`
        : undefined);

    if (listUrl) {
      try {
        const response = await fetch(listUrl);
        if (response.ok) {
          const payload = (await response.json()) as {
            revocations?: Array<{ assertionId?: string; reason?: string | null }>;
          };
          const assertionId = assertionUrl.split("/").pop() ?? "";
          const match = payload.revocations?.find(
            (item) => item.assertionId === assertionId,
          );
          if (match) {
            reasons.push("REVOKED");
            if (match.reason) {
              reasons.push(`REVOCATION_REASON:${match.reason}`);
            }
          }
        }
      } catch {
        // optional check only
      }
    }
  }

  return { ok: reasons.length === 0, reasons };
};
