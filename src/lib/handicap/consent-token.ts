import { SignJWT, jwtVerify } from "jose";

const PURPOSE = "disability_consent";

function secretKey() {
  const raw =
    process.env.DISABILITY_SENSITIVE_KEY?.trim() ||
    process.env.CFA_SENSITIVE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "byound-disability-consent-dev";
  return new TextEncoder().encode(`byound-disability-consent:${raw}`);
}

export async function signDisabilityConsentToken(caseId: string): Promise<string> {
  return new SignJWT({ caseId, purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());
}

export async function verifyDisabilityConsentToken(
  token: string,
): Promise<{ caseId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.purpose !== PURPOSE) return null;
    const caseId = String(payload.caseId ?? "").trim();
    if (!caseId) return null;
    return { caseId };
  } catch {
    return null;
  }
}
