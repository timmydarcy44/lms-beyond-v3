"use client";

import { createContext, useContext } from "react";
import type { ExpertAccessRow } from "@/lib/expert/expert-access";
import { isExpertApproved } from "@/lib/expert/expert-access";

type ExpertAccessContextValue = {
  expert: ExpertAccessRow;
  emailConfirmed: boolean;
  isApproved: boolean;
};

const ExpertAccessContext = createContext<ExpertAccessContextValue | null>(null);

export function ExpertAccessProvider({
  expert,
  emailConfirmed,
  children,
}: {
  expert: ExpertAccessRow;
  emailConfirmed: boolean;
  children: React.ReactNode;
}) {
  return (
    <ExpertAccessContext.Provider
      value={{
        expert,
        emailConfirmed,
        isApproved: isExpertApproved(expert),
      }}
    >
      {children}
    </ExpertAccessContext.Provider>
  );
}

export function useExpertAccess(): ExpertAccessContextValue {
  const ctx = useContext(ExpertAccessContext);
  if (!ctx) {
    throw new Error("useExpertAccess must be used within ExpertAccessProvider");
  }
  return ctx;
}
