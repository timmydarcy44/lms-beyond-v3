import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

/** Ancien hub → page marque Byound School. */
export default async function Page() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  redirect(routes.ecole);
}
