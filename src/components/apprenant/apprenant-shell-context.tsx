"use client";

import { createContext, useContext } from "react";

import {
  getApprenantPageTokens,
  type ApprenantConnectVariant,
  type ApprenantPageTokens,
} from "@/lib/apprenant/connect-theme";

export type ApprenantShellContextValue = {
  /** Ouvre le formulaire identité (nom, prénom, e-mail, photo, etc.) */
  openEditProfile: () => void;
  /** Copie le lien de la page publique /p/[slug] */
  sharePublicProfile: () => void | Promise<void>;
  variant: ApprenantConnectVariant;
};

const ApprenantShellContext = createContext<ApprenantShellContextValue | null>(null);

export function ApprenantShellProvider({
  value,
  children,
}: {
  value: ApprenantShellContextValue;
  children: React.ReactNode;
}) {
  return <ApprenantShellContext.Provider value={value}>{children}</ApprenantShellContext.Provider>;
}

export function useApprenantShell(): ApprenantShellContextValue | null {
  return useContext(ApprenantShellContext);
}

export function useApprenantPageTokens(): ApprenantPageTokens {
  const shell = useApprenantShell();
  return getApprenantPageTokens(shell?.variant ?? "edge");
}
