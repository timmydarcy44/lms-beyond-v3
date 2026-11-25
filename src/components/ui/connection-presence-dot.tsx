"use client";

import { cn } from "@/lib/utils";

/** Fenêtre d’activité récente pour la pastille verte (5 minutes). */
export const PRESENCE_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

/** Vert = activité récente (LMS / dernière vue) dans la fenêtre ; rouge sinon. */
export function isUserRecentlyActive(
  lastSeenAt: string | null | undefined,
  windowMs = PRESENCE_ACTIVE_WINDOW_MS,
): boolean {
  if (!lastSeenAt) return false;
  const t = Date.parse(lastSeenAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= windowMs;
}

/** @deprecated Prefer isUserRecentlyActive — conservé pour les imports existants. */
export function isUserConnected(lastSignInAt: string | null | undefined): boolean {
  return isUserRecentlyActive(lastSignInAt);
}

export function connectionPresenceLabel(lastSeenAt: string | null | undefined): string {
  return isUserRecentlyActive(lastSeenAt)
    ? "Actif (moins de 5 min)"
    : "Inactif (plus de 5 min ou jamais)";
}

type Props = {
  lastSignInAt?: string | null;
  /** Alias fréquent (activité LMS) — prioritaire pour la pastille. */
  lastSeenAt?: string | null;
  className?: string;
  size?: "sm" | "md";
  title?: string;
};

/**
 * Pastille de présence : verte si activité dans les 5 dernières minutes, rouge sinon.
 * Utilisée Business / CFA / BtoC — s’appuie de préférence sur l’activité LMS.
 */
export function ConnectionPresenceDot({
  lastSignInAt,
  lastSeenAt,
  className,
  size = "sm",
  title,
}: Props) {
  const at = lastSeenAt ?? lastSignInAt ?? null;
  const active = isUserRecentlyActive(at);
  const label = title ?? connectionPresenceLabel(at);
  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
        size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5",
        active ? "bg-[#1F9D57]" : "bg-[#E5484D]",
        className,
      )}
    />
  );
}
