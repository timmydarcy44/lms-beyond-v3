"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { UserRole } from "@/types/database";

type SessionContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<UserRole>("apprenant");

  const value = useMemo<SessionContextValue>(() => ({ role, setRole }), [role]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSessionMock = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionMock must be used within SessionProvider");
  }

  return context;
};


