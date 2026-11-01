import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { classifyModuleEntries, type PlaygroundModuleFile } from "@/lib/openbadges/playground-activity";

export function inspectZip(bytes: Uint8Array): { names: string[]; files: Map<string, string> } {
  const eocd = findEocd(bytes);
  if (!eocd) throw new Error("Archive ZIP illisible.");
  const names: string[] = [];
  const files = new Map<string, string>();
  let offset = eocd.centralOffset;
  for (let index = 0; index < eocd.count; index += 1) {
    if (readU32(bytes, offset) !== 0x02014b50) throw new Error("Archive ZIP illisible.");
    const method = readU16(bytes, offset + 10);
    const compressed = readU32(bytes, offset + 20);
    const nameLength = readU16(bytes, offset + 28);
    const extraLength = readU16(bytes, offset + 30);
    const commentLength = readU16(bytes, offset + 32);
    const localOffset = readU32(bytes, offset + 42);
    const name = Buffer.from(bytes.slice(offset + 46, offset + 46 + nameLength)).toString("utf8");
    if (name.includes("..") || name.startsWith("/") || name.startsWith("\\")) {
      throw new Error("Archive refusée : chemin non autorisé.");
    }
    names.push(name);
    if (!name.endsWith("/") && (name.toLowerCase().endsWith(".xml") || name.toLowerCase().endsWith(".html"))) {
      files.set(name, readZipFile(bytes, localOffset, method, compressed));
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return { names, files };
}

export function moduleVersionFromZip(bytes: Uint8Array, fileName: string, previousVersion = 0): PlaygroundModuleFile {
  const inspected = inspectZip(bytes);
  const manifestName = inspected.names.find((name) => /imsmanifest\.xml|tincan\.xml|cmi5\.xml/i.test(name));
  const manifest = manifestName ? inspected.files.get(manifestName) ?? "" : "";
  const classified = classifyModuleEntries(inspected.names, manifest);
  if (classified.format === "unknown") throw new Error("Format non reconnu. Attendu : SCORM, xAPI, cmi5 ou HTML5.");
  return {
    format: classified.format,
    version: previousVersion + 1,
    fileName,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    entry: classified.entry,
    scoreOnly: classified.scoreOnly,
    objectiveIds: classified.objectiveIds,
    objectiveMap: [],
  };
}

function findEocd(bytes: Uint8Array): { count: number; centralOffset: number } | null {
  const start = Math.max(0, bytes.length - 22 - 65535);
  for (let offset = bytes.length - 22; offset >= start; offset -= 1) {
    if (readU32(bytes, offset) !== 0x06054b50) continue;
    return { count: readU16(bytes, offset + 10), centralOffset: readU32(bytes, offset + 16) };
  }
  return null;
}

function readZipFile(bytes: Uint8Array, localOffset: number, method: number, compressed: number): string {
  if (readU32(bytes, localOffset) !== 0x04034b50) return "";
  const nameLength = readU16(bytes, localOffset + 26);
  const extraLength = readU16(bytes, localOffset + 28);
  const dataStart = localOffset + 30 + nameLength + extraLength;
  const slice = Buffer.from(bytes.slice(dataStart, dataStart + compressed));
  if (method === 0) return slice.toString("utf8");
  if (method === 8) return inflateRawSync(slice).toString("utf8");
  return "";
}

function readU16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + (bytes[offset + 1] << 8);
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + (bytes[offset + 3] * 0x1000000)) >>> 0;
}
