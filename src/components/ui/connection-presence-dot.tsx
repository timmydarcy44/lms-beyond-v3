"use client";

import { cn } from "@/lib/utils";

/** Vert = au moins une connexion Auth ; rouge = jamais connecté. */
export function isUserConnected(lastSignInAt: string | null | undefined): boolean {
  if (!lastSignInAt) return false;
  const t = Date.parse(lastSignInAt);
  return Number.isFinite(t);
}

export function connectionPresenceLabel(lastSignInAt: string | null | undefined): string {
  return isUserConnected(lastSignInAt) ? "Connecté" : "Non connecté";
}

type Props = {
  lastSignInAt?: string | null;
  /** Alias fréquent (activité LMS) si pas de last_sign_in. */
  lastSeenAt?: string | null;
  className?: string;
  size?: "sm" | "md";
  title?: string;
};

/**
 * Vignette de présence sur avatar : verte si la personne s’est déjà connectée, rouge sinon.
 * Utilisée Business / CFA / BtoC.
 */
export function ConnectionPresenceDot({
  lastSignInAt,
  lastSeenAt,
  className,
  size = "sm",
  title,
}: Props) {
  const at = lastSignInAt ?? lastSeenAt ?? null;
  const connected = isUserConnected(at);
  const label = title ?? connectionPresenceLabel(at);
  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
        size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5",
        connected ? "bg-[#1F9D57]" : "bg-[#E5484D]",
        className,
      )}
    />
  );
}
