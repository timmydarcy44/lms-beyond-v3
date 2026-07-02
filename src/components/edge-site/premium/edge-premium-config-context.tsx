"use client";

import { createContext, useContext } from "react";
import {
  getEdgePremiumConfig,
  type EdgePremiumConfig,
} from "@/lib/edge-site/premium-constants";

const EdgePremiumConfigContext = createContext<EdgePremiumConfig>(
  getEdgePremiumConfig(null),
);

export function EdgePremiumConfigProvider({
  config,
  children,
}: {
  config: EdgePremiumConfig;
  children: React.ReactNode;
}) {
  return (
    <EdgePremiumConfigContext.Provider value={config}>{children}</EdgePremiumConfigContext.Provider>
  );
}

export function useEdgePremiumConfig() {
  return useContext(EdgePremiumConfigContext);
}
