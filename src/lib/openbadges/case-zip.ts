export type ZipEntry = { name: string; data: Uint8Array };

const HIDDEN = /corrig|evaluat|évaluat|__macosx|\.ds_store/i;

function findEocd(bytes: Uint8Array): number {
  const start = Math.max(0, bytes.length - 22 - 65535);
  for (let index = bytes.length - 22; index >= start; index -= 1) {
    if (bytes[index] === 0x50 && bytes[index + 1] === 0x4b && bytes[index + 2] === 0x05 && bytes[index + 3] === 0x06) return index;
  }
  return -1;
}

async function inflate(input: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([input]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Lit un ZIP sans quitter la page. Ignore le corrigé et les fichiers système. */
export async function readCaseZip(buffer: ArrayBuffer): Promise<ZipEntry[]> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocd = findEocd(bytes);
  if (eocd < 0) return [];
  const count = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];
  for (let index = 0; index < count && cursor + 46 <= bytes.length; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;
    const base = name.split("/").pop() ?? name;
    if (!base || name.endsWith("/") || HIDDEN.test(name)) continue;
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : method === 8 ? await inflate(compressed) : null;
    if (data) entries.push({ name: base, data });
  }
  return entries;
}

export function fileBlob(data: Uint8Array, type: string) {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy.buffer], { type });
}

export function pieceKind(name: string): "pdf" | "sheet" | "image" | "text" | "other" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(xlsx|xls|csv)$/.test(lower)) return "sheet";
  if (/\.(png|jpe?g|webp|gif)$/.test(lower)) return "image";
  if (/\.(docx?|pptx?|pages|key|numbers)$/.test(lower)) return "other";
  return "text";
}
