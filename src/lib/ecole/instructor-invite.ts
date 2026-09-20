import { createHash, randomBytes } from "crypto";

import { INVITE_TTL_DAYS } from "@/lib/ecole/instructors";

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteExpiresAt(from = new Date(), days = INVITE_TTL_DAYS): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
