import { headers } from "next/headers";

/** Chemin demandé, propagé par `middleware` (`x-url-pathname`) pour le gating école / `role_type`. */
export async function getMiddlewarePathname(): Promise<string> {
  const h = await headers();
  return h.get("x-url-pathname") ?? "";
}
