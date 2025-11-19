import { toast } from "sonner";

/**
 * Gère les erreurs et les affiche via toast au lieu des erreurs du navigateur
 */
export function handleError(error: unknown, defaultMessage = "Une erreur est survenue"): void {
  let message = defaultMessage;
  let details: string | null = null;

  if (error instanceof Error) {
    message = error.message || defaultMessage;
    
    // Extraire les détails si disponibles
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

  console.error("[error-handler]", error);

  toast.error(message, {
    description: details || undefined,
    duration: 5000,
  });
}

/**
 * Wrapper pour les appels fetch avec gestion d'erreur automatique
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      let errorDetails: string | null = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData.details || null;
      } catch {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }

      const error = new Error(errorMessage);
      if (errorDetails) {
        (error as any).details = errorDetails;
      }

      handleError(error);
      return { data: null, error };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    handleError(error, "Erreur lors de la requête");
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Wrapper pour les appels API avec gestion d'erreur automatique et toast de succès
 */
export async function safeApiCall<T = unknown>(
  url: string,
  options?: RequestInit,
  successMessage?: string
): Promise<{ data: T | null; error: Error | null }> {
  const result = await safeFetch<T>(url, options);

  if (result.data && !result.error && successMessage) {
    toast.success(successMessage);
  }

  return result;
}





