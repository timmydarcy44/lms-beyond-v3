"use client";

function storageKey(urlToken: string): string {
  return `byound_ready_session:${urlToken}`;
}

export function saveReadyClientSession(urlToken: string, sessionValue: string) {
  try {
    sessionStorage.setItem(storageKey(urlToken), sessionValue);
  } catch {
    /* private mode */
  }
}

export function readReadyClientSession(urlToken: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(urlToken));
  } catch {
    return null;
  }
}

export function clearReadyClientSession(urlToken: string) {
  try {
    sessionStorage.removeItem(storageKey(urlToken));
  } catch {
    /* ignore */
  }
}

export function readyAuthHeaders(urlToken: string): HeadersInit {
  const session = readReadyClientSession(urlToken);
  if (!session) return {};
  return {
    Authorization: `Bearer ${session}`,
    "x-ready-session": session,
  };
}
