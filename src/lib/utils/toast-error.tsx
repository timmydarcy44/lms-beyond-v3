"use client";

import { toast } from "sonner";

/**
 * Wrapper pour les erreurs qui affiche un toast au lieu d'une erreur du navigateur
 * À utiliser dans les try/catch des appels API côté client
 */
export function toastError(error: unknown, defaultMessage = "Une erreur est survenue"): void {
  let message = defaultMessage;
  let details: string | null = null;

  if (error instanceof Error) {
    message = error.message || defaultMessage;
    if ("details" in error && typeof error.details === "string") {
      details = error.details;
    }
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
    if ("details" in error && typeof error.details === "string") {
      details = error.details;
    }
  }

  console.error("[toast-error]", error);

  toast.error(message, {
    description: details || undefined,
    duration: 5000,
  });
}





