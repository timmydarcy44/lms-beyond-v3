import { createHash, randomBytes } from "node:crypto";

export function createBadgeSalt(): string {
  return randomBytes(16).toString("hex");
}

/** sha256(email normalisé + sel). L'email en clair ne sort pas de cette fonction. */
export function hashBadgeEmail(email: string, salt: string): string {
  const normalized = email.trim().toLowerCase();
  const digest = createHash("sha256").update(`${normalized}${salt}`).digest("hex");
  return `sha256$${digest}`;
}
