"use client";

import type { ReactNode } from "react";

/** @deprecated L'auth club est gérée par `src/app/dashboard/club/layout.tsx` (serveur). */
export type ClubGuardStatus = "loading" | "allowed" | "denied";

/** Conservé pour compatibilité — ne bloque plus le rendu côté client. */
export function useClubGuard(): ClubGuardStatus {
  return "allowed";
}

/** Passe-through : ne bloque plus le rendu. */
export function ClubGuardGate({
  children,
}: {
  status?: ClubGuardStatus;
  children: ReactNode;
}) {
  return <>{children}</>;
}
