import { buildOpenBadgeCredential, type OpenBadgeCredentialInput } from "@/lib/openbadges/v3/credential";
import { signCredentialJwt } from "@/lib/openbadges/v3/sign";

export async function issueOpenBadgeCredential(badgeClassId: string, input: OpenBadgeCredentialInput) {
  const credential = buildOpenBadgeCredential(badgeClassId, input);
  const signed = await signCredentialJwt(credential);
  return { credential, signed };
}
