const ALLOWED_EXTENSIONS = new Set([
  "html",
  "htm",
  "css",
  "js",
  "mjs",
  "json",
  "svg",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "mp3",
  "mp4",
  "webm",
  "wav",
  "ogg",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "txt",
  "xml",
  "map",
  "wasm",
  "ico",
  "webmanifest",
]);

const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  wav: "audio/wav",
  ogg: "audio/ogg",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml",
  map: "application/json",
  wasm: "application/wasm",
  ico: "image/x-icon",
  webmanifest: "application/manifest+json",
};

export const INTERACTIVE_GAME_MAX_ZIP_BYTES = 80 * 1024 * 1024;
export const INTERACTIVE_GAME_MAX_FILE_BYTES = 4 * 1024 * 1024;
export const INTERACTIVE_GAME_MAX_FILES = 400;
export const INTERACTIVE_GAME_MAX_UNCOMPRESSED_BYTES = 150 * 1024 * 1024;

export function interactiveGameContentType(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/** Chemin relatif sûr à l'intérieur du zip. */
export function sanitizeInteractiveGamePath(raw: string): string | null {
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.endsWith("/")) return null;
  if (normalized.includes("\0") || normalized.length > 240) return null;
  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part === "__MACOSX")) return null;
  const base = parts[parts.length - 1] ?? "";
  if (base.startsWith(".")) return null;
  const ext = base.includes(".") ? base.split(".").pop()!.toLowerCase() : "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  return parts.join("/");
}

export function pickInteractiveGameEntry(paths: string[]) {
  const html = paths.filter((path) => /index\.html?$/i.test(path));
  if (html.length === 0) return null;
  return [...html].sort((a, b) => a.split("/").length - b.split("/").length || a.length - b.length)[0] ?? null;
}

function findZipEnd(bytes: Uint8Array) {
  const min = Math.max(0, bytes.length - 22 - 65535);
  for (let i = bytes.length - 22; i >= min; i -= 1) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
      return i;
    }
  }
  return -1;
}

async function inflateRaw(data: Uint8Array) {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readInteractiveGameZip(bytes: Uint8Array) {
  if (bytes.byteLength > INTERACTIVE_GAME_MAX_ZIP_BYTES) {
    throw new Error("Le fichier zip dépasse 80 Mo.");
  }
  const eocd = findZipEnd(bytes);
  if (eocd < 0) throw new Error("Archive zip illisible.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  if (count > INTERACTIVE_GAME_MAX_FILES) throw new Error("Le zip contient trop de fichiers.");

  const files: { path: string; data: Uint8Array }[] = [];
  let uncompressedTotal = 0;
  for (let i = 0; i < count; i += 1) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen));
    cursor += 46 + nameLen + extraLen + commentLen;

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error("Les archives zip64 ne sont pas prises en charge.");
    }
    const safe = sanitizeInteractiveGamePath(name);
    if (!safe) continue;
    if (localOffset + 30 > bytes.length) throw new Error("Archive zip incomplète.");
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) throw new Error("Archive zip incomplète.");
    const compressed = bytes.subarray(dataStart, dataEnd);
    const data = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null;
    if (!data) throw new Error(`Compression non prise en charge pour « ${safe} ».`);
    if (data.byteLength > INTERACTIVE_GAME_MAX_FILE_BYTES) {
      throw new Error(`« ${safe} » dépasse 4 Mo.`);
    }
    uncompressedTotal += data.byteLength;
    if (uncompressedTotal > INTERACTIVE_GAME_MAX_UNCOMPRESSED_BYTES) {
      throw new Error("Le contenu décompressé est trop volumineux.");
    }
    files.push({ path: safe, data });
  }

  const entry = pickInteractiveGameEntry(files.map((file) => file.path));
  if (!entry) throw new Error("Le zip doit contenir un fichier index.html.");
  return { files, entry };
}
