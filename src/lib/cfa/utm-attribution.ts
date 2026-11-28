export const BYOUND_UTM_COOKIE = "byound_school_utm";
const MAX_AGE_SEC = 60 * 60 * 24 * 90;

export type UtmAttribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string;
  captured_at: string;
};

function clean(value: unknown, max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

export function parseUtmAttribution(raw: unknown): UtmAttribution | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const utm_source = clean(row.utm_source);
  const utm_medium = clean(row.utm_medium);
  const utm_campaign = clean(row.utm_campaign);
  const referrer = clean(row.referrer, 400);
  if (!utm_source && !utm_medium && !utm_campaign && !referrer) return null;
  return {
    utm_source,
    utm_medium,
    utm_campaign,
    referrer,
    captured_at: clean(row.captured_at) || new Date().toISOString(),
  };
}

export function attributionFromSearch(search: string, referrer = ""): UtmAttribution | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parseUtmAttribution({
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    referrer,
    captured_at: new Date().toISOString(),
  });
}

/** First-touch : on ne remplace jamais un utm_source déjà capturé. */
export function mergeFirstTouchAttribution(
  stored: UtmAttribution | null,
  incoming: UtmAttribution | null,
): UtmAttribution | null {
  if (!stored) return incoming;
  if (!incoming) return stored;
  return {
    utm_source: stored.utm_source || incoming.utm_source,
    utm_medium: stored.utm_medium || incoming.utm_medium,
    utm_campaign: stored.utm_campaign || incoming.utm_campaign,
    referrer: stored.referrer || incoming.referrer,
    captured_at: stored.captured_at || incoming.captured_at,
  };
}

export function readUtmCookie(cookieHeader?: string | null): UtmAttribution | null {
  if (typeof document !== "undefined" && cookieHeader == null) {
    cookieHeader = document.cookie;
  }
  const match = String(cookieHeader ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${BYOUND_UTM_COOKIE}=`));
  if (!match) return null;
  try {
    return parseUtmAttribution(JSON.parse(decodeURIComponent(match.slice(BYOUND_UTM_COOKIE.length + 1))));
  } catch {
    return null;
  }
}

export function utmCookieString(value: UtmAttribution) {
  return `${BYOUND_UTM_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`;
}
