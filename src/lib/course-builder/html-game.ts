function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/** Document HTML autonome, y compris s'il a été collé comme texte échappé dans l'éditeur. */
export function extractStandaloneHtmlDocument(raw: string | null | undefined): string | null {
  const source = String(raw ?? "");
  if (!source.trim()) return null;

  const candidates = [source, decodeBasicEntities(source.replace(/<[^>]+>/g, "\n"))];
  for (const candidate of candidates) {
    const start = candidate.search(/<!doctype\s+html\b|<html[\s>]/i);
    if (start < 0) continue;
    const slice = candidate.slice(start).trim();
    if (slice.length < 40) continue;
    return slice;
  }
  return null;
}

export function isHtmlGameUrl(url: string | null | undefined) {
  const value = String(url ?? "").trim();
  if (!value) return false;
  try {
    const path = new URL(value).pathname.toLowerCase();
    return path.endsWith(".html") || path.endsWith(".htm");
  } catch {
    return /\.html?(?:$|[?#])/i.test(value);
  }
}
