"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Wrapper client pour détecter le pathname et conditionner la logique
 * Ce composant permet de savoir si on est sur une route /companies
 */
export function BeyondConnectAppLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCompaniesRoute = pathname?.startsWith("/beyond-connect-app/companies");
  
  // Si on est sur une route /companies, ne pas wrapper avec le header (le layout /companies gère son propre header)
  // Mais en fait, le layout /companies ne doit pas avoir de header non plus, donc on laisse passer
  return <>{children}</>;
}

