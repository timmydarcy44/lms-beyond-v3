import { headers } from "next/headers";

import {
  getEdgeOnlineHrefPrefixFromHost,
  type EdgeOnlineHrefPrefix,
} from "@/lib/edge-online-public-path";

export async function getEdgeOnlineHrefPrefixServer(): Promise<EdgeOnlineHrefPrefix> {
  const h = await headers();
  const xf = h.get("x-forwarded-host");
  const host = xf?.split(",")[0]?.trim() || h.get("host") || "";
  return getEdgeOnlineHrefPrefixFromHost(host);
}
