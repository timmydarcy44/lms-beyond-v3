/** Texte lisible : un séparateur entre deux blocs, sans balises. */
export function htmlToPlain(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article|figcaption|td|th)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

/** Identifie chaque bloc pour retrouver un surlignage plus tard. */
export function stampNoteBlocks(html: string): string {
  let index = 0;
  return html.replace(/<(p|h[1-6]|li|blockquote)\b([^>]*)>/gi, (full, name: string, rest: string) => {
    if (/data-note-block\s*=/i.test(rest)) return full;
    index += 1;
    return `<${name}${rest} data-note-block="b${index}">`;
  });
}

/** Le texte sélectionné, avec un saut entre les blocs HTML copiés. */
export function selectionPlain(range: Range): string {
  const box = document.createElement("div");
  box.append(range.cloneContents());
  const plain = htmlToPlain(box.innerHTML);
  return plain || range.toString().replace(/\s+/g, " ").trim();
}
