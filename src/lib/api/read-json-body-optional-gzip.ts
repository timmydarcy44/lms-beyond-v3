import { gunzipSync } from "node:zlib";
import type { NextRequest } from "next/server";

/**
 * Lit le corps JSON, avec support optionnel `Content-Encoding: gzip`.
 * Permet de passer sous les limites nginx `client_max_body_size` en production
 * lorsque le snapshot de parcours est volumineux.
 */
export async function readJsonBodyOptionalGzip(request: NextRequest): Promise<unknown> {
  const encoding = (request.headers.get("content-encoding") ?? "").toLowerCase();
  const buf = Buffer.from(await request.arrayBuffer());

  let text: string;
  if (encoding.includes("gzip")) {
    try {
      text = gunzipSync(buf).toString("utf8");
    } catch {
      throw new SyntaxError("Corps gzip invalide ou corrompu.");
    }
  } else {
    text = buf.toString("utf8");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (e) {
    throw new SyntaxError(e instanceof Error ? e.message : "JSON invalide.");
  }
}
