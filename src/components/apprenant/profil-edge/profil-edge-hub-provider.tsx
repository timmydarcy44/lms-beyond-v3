"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useProfilEdgeHubData,
  type ProfilEdgeHubData,
} from "@/hooks/use-profil-edge-hub-data";

const ProfilEdgeHubContext = createContext<ProfilEdgeHubData | null>(null);

/** Un seul chargement hub partagé entre Vue d'ensemble et Mon évolution. */
export function ProfilEdgeHubProvider({ children }: { children: ReactNode }) {
  const value = useProfilEdgeHubData();
  return <ProfilEdgeHubContext.Provider value={value}>{children}</ProfilEdgeHubContext.Provider>;
}

export function useProfilEdgeHub(): ProfilEdgeHubData {
  const ctx = useContext(ProfilEdgeHubContext);
  if (!ctx) {
    throw new Error("useProfilEdgeHub doit être utilisé dans ProfilEdgeHubProvider.");
  }
  return ctx;
}
