"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { EdgeOnlineHrefPrefix } from "@/lib/edge-online-public-path";

const EdgeOnlineHrefPrefixContext = createContext<EdgeOnlineHrefPrefix>("");

export function EdgeOnlineHrefPrefixProvider({
  prefix,
  children,
}: {
  prefix: EdgeOnlineHrefPrefix;
  children: ReactNode;
}) {
  return (
    <EdgeOnlineHrefPrefixContext.Provider value={prefix}>{children}</EdgeOnlineHrefPrefixContext.Provider>
  );
}

/** Préfixe pour les URLs « canoniques » edgeonline.fr (/formations) → route interne sous dev. Vide hors surface EDGE Online. */
export function useOptionalEdgeOnlineHrefPrefix(): EdgeOnlineHrefPrefix {
  return useContext(EdgeOnlineHrefPrefixContext);
}
