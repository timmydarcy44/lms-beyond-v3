import { headers } from "next/headers";

import {
  resolveEdgeOnlineHrefPrefix,
  type EdgeOnlineHrefPrefix,
} from "@/lib/edge-online-public-path";

export async function getEdgeOnlineHrefPrefixServer(): Promise<EdgeOnlineHrefPrefix> {
  const h = await headers();
  const xf = h.get("x-forwarded-host");
  const host = xf?.split(",")[0]?.trim() || h.get("host") || "";
  const pathname = h.get("x-url-pathname") || h.get("x-invoke-path") || "";
  return resolveEdgeOnlineHrefPrefix(pathname, host);
}
