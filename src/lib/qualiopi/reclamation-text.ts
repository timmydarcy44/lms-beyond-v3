/** Normalise les retours à la ligne littéraux « \n » stockés ou collés. */
export function normalizeReclamationBody(raw: string | null | undefined): string {
  return String(raw ?? "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}
