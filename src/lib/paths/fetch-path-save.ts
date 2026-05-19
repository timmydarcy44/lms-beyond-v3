/**
 * Sauvegarde parcours via /api/paths : compresse en gzip si le JSON dépasse un seuil,
 * pour éviter les 413 (Content Too Large) derrière nginx / reverse-proxy en production.
 *
 * Compression via Blob + pipeThrough (plus fiable que writable.getWriter pour gros payloads).
 */

const GZIP_THRESHOLD_BYTES = 96 * 1024;
/** Évite « Publication… » infini si le réseau ou le serveur ne répond pas. */
const REQUEST_TIMEOUT_MS = 120_000;

function abortSignalWithTimeout(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const ctl = new AbortController();
  setTimeout(() => {
    ctl.abort(new DOMException(`La requête a dépassé ${ms / 1000}s`, "TimeoutError"));
  }, ms);
  return ctl.signal;
}

async function gzipJsonString(json: string): Promise<ArrayBuffer | null> {
  try {
    if (typeof CompressionStream === "undefined") return null;
    const blob = new Blob([json]);
    const compressed = blob.stream().pipeThrough(new CompressionStream("gzip"));
    return await new Response(compressed).arrayBuffer();
  } catch {
    return null;
  }
}

export async function fetchPathSave(
  endpoint: string,
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
): Promise<Response> {
  const signal = abortSignalWithTimeout(REQUEST_TIMEOUT_MS);
  const json = JSON.stringify(payload);
  const byteLength = new TextEncoder().encode(json).byteLength;

  if (byteLength > GZIP_THRESHOLD_BYTES) {
    const gz = await gzipJsonString(json);
    if (gz && gz.byteLength > 0 && gz.byteLength < byteLength) {
      return fetch(endpoint, {
        method,
        signal,
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
        },
        body: gz,
      });
    }
  }

  return fetch(endpoint, {
    method,
    signal,
    headers: { "Content-Type": "application/json" },
    body: json,
  });
}
