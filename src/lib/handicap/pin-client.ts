/**
 * PIN référent handicap (navigateur uniquement) : salt + hash SHA-256, jamais le code en clair.
 * Le déverrouillage de session est stocké dans sessionStorage pour l’onglet courant.
 */

export function handicapPinSaltKey(userId: string) {
  return `beyond_handicap_pin_salt_${userId}`;
}

export function handicapPinHashKey(userId: string) {
  return `beyond_handicap_pin_hash_${userId}`;
}

export function handicapSessionUnlockKey(userId: string) {
  return `beyond_handicap_unlock_${userId}`;
}

async function sha256Hex(message: string): Promise<string> {
  const enc = new TextEncoder().encode(message);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashHandicapPin(pin: string, userId: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${userId}:${pin}`);
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin.trim());
}

export function readPinConfig(userId: string): { salt: string; hash: string } | null {
  if (typeof window === "undefined") return null;
  const salt = localStorage.getItem(handicapPinSaltKey(userId)) ?? "";
  const hash = localStorage.getItem(handicapPinHashKey(userId)) ?? "";
  if (!salt || !hash) return null;
  return { salt, hash };
}

export function writePinConfig(userId: string, salt: string, hash: string) {
  localStorage.setItem(handicapPinSaltKey(userId), salt);
  localStorage.setItem(handicapPinHashKey(userId), hash);
}

export function clearPinConfig(userId: string) {
  localStorage.removeItem(handicapPinSaltKey(userId));
  localStorage.removeItem(handicapPinHashKey(userId));
}

export function isHandicapSessionUnlocked(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(handicapSessionUnlockKey(userId)) === "1";
}

export function setHandicapSessionUnlocked(userId: string) {
  sessionStorage.setItem(handicapSessionUnlockKey(userId), "1");
}

export function clearHandicapSessionUnlock(userId: string) {
  sessionStorage.removeItem(handicapSessionUnlockKey(userId));
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
