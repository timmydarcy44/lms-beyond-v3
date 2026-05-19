const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function normalizeStudentJoinCode(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

/** Code lisible (sans 0/O/1/l ambigus). */
export function generateStudentJoinCode(length = 10): string {
  const n = Math.max(6, Math.min(24, length));
  let out = "";
  for (let i = 0; i < n; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
  }
  return out;
}
