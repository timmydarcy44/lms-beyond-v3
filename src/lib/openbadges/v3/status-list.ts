import zlib from "node:zlib";

const MIN_BYTES = 16 * 1024;

/** Bitstring Status List : bit de poids faible en premier, gzip, multibase base64url. */
export function encodeStatusList(revokedIndexes: number[]): string {
  const highest = revokedIndexes.reduce((max, index) => Math.max(max, index), 0);
  const size = Math.max(MIN_BYTES, Math.ceil((highest + 1) / 8));
  const bytes = Buffer.alloc(size);
  for (const index of revokedIndexes) {
    if (!Number.isInteger(index) || index < 0) continue;
    const byteIndex = Math.floor(index / 8);
    bytes[byteIndex] |= 1 << (index % 8);
  }
  return `u${zlib.gzipSync(bytes).toString("base64url")}`;
}

export function statusBit(encodedList: string, index: number): boolean {
  if (!Number.isInteger(index) || index < 0) return false;
  const payload = encodedList.startsWith("u") ? encodedList.slice(1) : encodedList;
  const bytes = zlib.gunzipSync(Buffer.from(payload, "base64url"));
  const byteIndex = Math.floor(index / 8);
  if (byteIndex >= bytes.length) return false;
  return (bytes[byteIndex] & (1 << (index % 8))) !== 0;
}

export function isPublicBadgeVisible(row: { is_public: boolean; revoked_at?: string | null } | null): boolean {
  return Boolean(row?.is_public);
}
