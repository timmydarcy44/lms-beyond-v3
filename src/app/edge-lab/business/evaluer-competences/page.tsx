import { permanentRedirect } from "next/navigation";
import { headers } from "next/headers";

import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

/** Ancienne URL mega-menu → page Diagnostics. */
export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  permanentRedirect(routes.businessDiagnostics);
}
