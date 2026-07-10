import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const JESSICA_OAUTH_DEFAULT_REDIRECT =
  "https://jessicacontentin.fr/api/jessica/google-calendar/callback";

/** ID du calendrier cabinet (URL iCal Google ou variable dédiée). */
export function getJessicaGoogleCalendarId(): string {
  const explicit = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (explicit) return explicit;

  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL?.trim();
  if (icalUrl) {
    const match = icalUrl.match(/\/ical\/([^/]+)\//);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return "primary";
}

function requireGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI?.trim() ||
    (process.env.JESSICA_APP_URL?.trim()
      ? `${process.env.JESSICA_APP_URL.replace(/\/$/, "")}/api/jessica/google-calendar/callback`
      : JESSICA_OAUTH_DEFAULT_REDIRECT);

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getGoogleCalendarRedirectUri(): string {
  return requireGoogleOAuthConfig().redirectUri;
}

export function getGoogleCalendarAuthUrl(state: string): string {
  const { clientId, redirectUri } = requireGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCalendarCode(code: string) {
  const { clientId, clientSecret, redirectUri } = requireGoogleOAuthConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Échec OAuth Google");
  }
  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = requireGoogleOAuthConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Refresh token Google invalide");
  }
  return data as { access_token: string; expires_in: number };
}

export async function createGoogleCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  attendeeEmail?: string;
}): Promise<string | null> {
  const body: Record<string, unknown> = {
    summary: params.summary,
    description: params.description,
    start: { dateTime: params.startIso },
    end: { dateTime: params.endIso },
  };
  if (params.attendeeEmail) {
    body.attendees = [{ email: params.attendeeEmail }];
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    console.error("[google-calendar] create event", data);
    return null;
  }
  return data.id ? String(data.id) : null;
}

export async function listGoogleCalendarEvents(params: {
  accessToken: string;
  calendarId: string;
  timeMin: string;
  timeMax: string;
}) {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events`,
  );
  url.searchParams.set("timeMin", params.timeMin);
  url.searchParams.set("timeMax", params.timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${params.accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Impossible de lire Google Calendar");
  }
  return (data.items ?? []) as Array<{
    id: string;
    status?: string;
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    attendees?: Array<{ email?: string }>;
  }>;
}

export { JESSICA_CONTENTIN_EMAIL };
