import zlib from "node:zlib";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const crcTable = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer: Buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

type PngChunk = {
  type: string;
  data: Buffer;
};

const readChunks = (buffer: Buffer): PngChunk[] => {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Invalid PNG signature");
  }
  const chunks: PngChunk[] = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
};

const encodeChunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(crcValue, 0);
  return Buffer.concat([length, typeBuf, data, crc]);
};

const buildITXt = (keyword: string, value: string) => {
  const keywordBuf = Buffer.from(keyword, "latin1");
  const nullSep = Buffer.from([0]);
  const compressionFlag = Buffer.from([0]);
  const compressionMethod = Buffer.from([0]);
  const languageTag = Buffer.from("", "latin1");
  const translatedKeyword = Buffer.from("", "utf8");
  const valueBuf = Buffer.from(value, "utf8");
  return Buffer.concat([
    keywordBuf,
    nullSep,
    compressionFlag,
    compressionMethod,
    languageTag,
    nullSep,
    translatedKeyword,
    nullSep,
    valueBuf,
  ]);
};

export const bakePng = (png: Buffer, payload: string) => {
  const chunks = readChunks(png);
  const itxt = buildITXt("openbadges", payload);
  const output: Buffer[] = [PNG_SIGNATURE];

  for (const chunk of chunks) {
    if (chunk.type === "IEND") {
      output.push(encodeChunk("iTXt", itxt));
    }
    output.push(encodeChunk(chunk.type, chunk.data));
  }

  return Buffer.concat(output);
};

export const unbakePng = (png: Buffer) => {
  const chunks = readChunks(png);
  for (const chunk of chunks) {
    if (chunk.type !== "iTXt") continue;
    const data = chunk.data;
    const keywordEnd = data.indexOf(0x00);
    if (keywordEnd < 0) continue;
    const keyword = data.subarray(0, keywordEnd).toString("latin1");
    if (keyword !== "openbadges") continue;
    const compressionFlag = data[keywordEnd + 1];
    const compressionMethod = data[keywordEnd + 2];
    let offset = keywordEnd + 3;
    const langEnd = data.indexOf(0x00, offset);
    offset = langEnd + 1;
    const transEnd = data.indexOf(0x00, offset);
    offset = transEnd + 1;
    let value = data.subarray(offset);
    if (compressionFlag === 1 && compressionMethod === 0) {
      value = zlib.inflateSync(value);
    }
    return value.toString("utf8");
  }
  return null;
};
