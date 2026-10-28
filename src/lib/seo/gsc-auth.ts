import { createSign } from "node:crypto";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export function gscProperty() {
  return process.env.GSC_PROPERTY?.trim() || "sc-domain:byound.fr";
}

export function gscCredentials() {
  const jsonRaw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) {
    const parsed = JSON.parse(jsonRaw) as { client_email?: string; private_key?: string };
    if (parsed.client_email && parsed.private_key) {
      return { email: parsed.client_email, key: parsed.private_key.replace(/\\n/g, "\n") };
    }
  }
  const email = process.env.GSC_CLIENT_EMAIL?.trim();
  const key = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (email && key) return { email, key };
  return null;
}

export function gscIsConfigured() {
  return Boolean(gscCredentials());
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

export async function gscAccessToken() {
  const creds = gscCredentials();
  if (!creds) throw new Error("Search Console n'est pas configurée (variables d'environnement).");
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: creds.email,
      scope: SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const assertion = `${header}.${payload}.${signer.sign(creds.key, "base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error || `OAuth Search Console ${res.status}`);
  }
  return json.access_token;
}
