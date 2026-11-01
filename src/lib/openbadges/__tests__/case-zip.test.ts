import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { pieceKind, readCaseZip } from "@/lib/openbadges/case-zip";

function zip(files: Array<{ name: string; data: string; store?: boolean }>): ArrayBuffer {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const raw = new TextEncoder().encode(file.data);
    const payload = file.store ? raw : deflateRawSync(raw);
    const local = new Uint8Array(30 + name.length + payload.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(8, file.store ? 0 : 8, true);
    view.setUint32(18, payload.length, true);
    view.setUint32(22, raw.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(payload, 30 + name.length);
    locals.push(local);
    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(10, file.store ? 0 : 8, true);
    centralView.setUint32(20, payload.length, true);
    centralView.setUint32(24, raw.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  const parts = [...locals, ...centrals, end];
  const total = parts.reduce((sum, item) => sum + item.length, 0);
  const bytes = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    bytes.set(part, cursor);
    cursor += part.length;
  }
  return bytes.buffer;
}

describe("readCaseZip", () => {
  it("ouvre les pièces et laisse le corrigé de côté", async () => {
    const buffer = zip([
      { name: "Piece1_sequence.pdf", data: "sequence", store: true },
      { name: "Piece2_observations.xlsx", data: "table" },
      { name: "Corrige_evaluateur.pdf", data: "secret" },
      { name: "__MACOSX/._Piece1_sequence.pdf", data: "junk", store: true },
    ]);
    const entries = await readCaseZip(buffer);
    expect(entries.map((entry) => entry.name)).toEqual(["Piece1_sequence.pdf", "Piece2_observations.xlsx"]);
    expect(new TextDecoder().decode(entries[0].data)).toBe("sequence");
    expect(new TextDecoder().decode(entries[1].data)).toBe("table");
    expect(pieceKind("Piece1_sequence.pdf")).toBe("pdf");
    expect(pieceKind("Piece2_observations.xlsx")).toBe("sheet");
  });
});
