"use client";

import { createContext, useContext } from "react";

export type ApprenantShellContextValue = {
  /** Ouvre le formulaire identité (nom, prénom, e-mail, photo, etc.) */
  openEditProfile: () => void;
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
