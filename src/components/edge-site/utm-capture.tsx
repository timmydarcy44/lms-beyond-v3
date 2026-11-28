"use client";

import { useEffect } from "react";

import {
  attributionFromSearch,
  BYOUND_UTM_COOKIE,
  mergeFirstTouchAttribution,
  parseUtmAttribution,
  utmCookieString,
} from "@/lib/cfa/utm-attribution";

export function UtmCapture() {
  useEffect(() => {
    const incoming = attributionFromSearch(window.location.search, document.referrer);
    if (!incoming) return;
    let stored = null;
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${BYOUND_UTM_COOKIE}=`));
    if (match) {
      try {
        stored = parseUtmAttribution(JSON.parse(decodeURIComponent(match.slice(BYOUND_UTM_COOKIE.length + 1))));
      } catch {
        stored = null;
      }
    }
    const merged = mergeFirstTouchAttribution(stored, incoming);
    if (merged) document.cookie = utmCookieString(merged);
  }, []);
  return null;
}
