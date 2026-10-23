import type { CalloutVariant } from "@/components/lms/Callout";

export type ReadingBlock =
  | { type: "html"; html: string }
  | { type: "callout"; variant: CalloutVariant; html: string }
  | { type: "heading"; number: string | null; title: string };

const LABEL_RE =
  /^(?:\s|&nbsp;|<[^>]+>)*(?:d[ée]finition|exemple(?:\s+concret)?|[àa]\s+retenir)(?:\s*<\/[^>]+>)?\s*:\s*(?:\s*<\/[^>]+>)*/i;

export function stripCalloutLabel(html: string): string {
  let next = html
    .replace(/<span[^>]*lesson-reader__callout-icon[\s\S]*?<\/span>/gi, "")
    .replace(/<p[^>]*lesson-reader__callout-label[\s\S]*?<\/p>/gi, "")
    .replace(LABEL_RE, "")
    .trim();
  if (!/<p\b/i.test(next)) next = next.replace(/<\/p>\s*$/i, "").trim();
  return next;
}

export function splitSectionTitle(raw: string): { number: string | null; title: string } {
  const text = raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const match = text.match(/^(\d+(?:\.\d+)+)\s+(.+)$/);
  if (!match) return { number: null, title: text };
  return { number: match[1], title: match[2].trim() };
}

function calloutVariant(openTag: string): CalloutVariant | null {
  const data = openTag.match(/data-callout\s*=\s*["'](definition|example|key)["']/i);
  if (data) return data[1].toLowerCase() as CalloutVariant;
  const blob = `${openTag.match(/class\s*=\s*["']([^"']*)["']/i)?.[1] ?? ""} ${openTag.match(/style\s*=\s*["']([^"']*)["']/i)?.[1] ?? ""}`.toLowerCase();
  if (/lesson-reader__callout/.test(blob)) return "key";
  if (/bg-red-50|border-red-500|text-red-900/.test(blob)) return "definition";
  if (/bg-green-50|border-green-500|text-green-900/.test(blob)) return "example";
  if (/bg-amber-50|border-amber-500|text-amber-9|bg-yellow-50|border-yellow-/.test(blob)) return "key";
  return null;
}

function textOf(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function isTakeawayLabel(html: string): boolean {
  return /^[àa]\s+retenir\s*:?\s*$/i.test(textOf(html));
}

function closeAfter(html: string, openStart: number, tag: string): { closeStart: number; end: number } | null {
  const token = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  token.lastIndex = openStart;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = token.exec(html))) {
    if (match[1] === "/") {
      depth -= 1;
      if (depth === 0) return { closeStart: match.index, end: token.lastIndex };
    } else {
      depth += 1;
    }
  }
  return null;
}

function pushHtml(blocks: ReadingBlock[], html: string) {
  if (!html || !html.trim()) return;
  const last = blocks[blocks.length - 1];
  if (last?.type === "html") last.html += html;
  else blocks.push({ type: "html", html });
}

export function parseReadingBlocks(html: string): ReadingBlock[] {
  const source = String(html ?? "");
  const blocks: ReadingBlock[] = [];
  let cursor = 0;
  const opener = /<(h2|h3|div|aside|p|strong)\b[^>]*>/gi;

  while (cursor < source.length) {
    opener.lastIndex = cursor;
    const match = opener.exec(source);
    if (!match) {
      pushHtml(blocks, source.slice(cursor));
      break;
    }
    const start = match.index;
    const tag = match[1].toLowerCase();
    const open = match[0];
    const span = closeAfter(source, start, tag);
    if (!span) {
      pushHtml(blocks, source.slice(cursor));
      break;
    }
    const { closeStart, end } = span;
    const inner = source.slice(start + open.length, closeStart);
    const variant = tag === "div" || tag === "aside" ? calloutVariant(open) : null;
    const takeaway = (tag === "h2" || tag === "h3" || tag === "p" || tag === "strong") && isTakeawayLabel(inner);

    if (!variant && !takeaway && tag !== "h2" && tag !== "h3") {
      pushHtml(blocks, source.slice(cursor, start + open.length));
      cursor = start + open.length;
      continue;
    }

    pushHtml(blocks, source.slice(cursor, start));
    if (variant) {
      blocks.push({ type: "callout", variant, html: stripCalloutLabel(inner) });
      cursor = end;
      continue;
    }
    if (takeaway) {
      const follow = /^(\s*)(<(p|ul)\b[\s\S]*?<\/\3>)/i.exec(source.slice(end));
      blocks.push({ type: "callout", variant: "key", html: stripCalloutLabel(follow?.[2] ?? "") });
      cursor = end + (follow ? follow[0].length : 0);
      continue;
    }
    const split = splitSectionTitle(inner);
    blocks.push({ type: "heading", number: split.number, title: split.title });
    cursor = end;
  }

  return blocks;
}
