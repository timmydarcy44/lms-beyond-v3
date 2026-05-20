import { redirect } from "next/navigation";

import { edgeOnlinePublicHref } from "@/lib/edge-online-public-path";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";

/** Ancienne URL catalogue — redirige vers la home EDGE Online (`/` ou `/edgeonline`). */
export default async function EdgeOnlineFormationsRedirectPage() {
  const prefix = await getEdgeOnlineHrefPrefixServer();
  redirect(edgeOnlinePublicHref("/", prefix));
}
