import { publicAppUrl } from "@/lib/env";

/**
 * Obtient l'URL de base pour Beyond Connect
 * En production, utilise le domaine Beyond Connect, sinon utilise NEXT_PUBLIC_URL
 */
export function getBeyondConnectBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BEYOND_CONNECT_URL) {
    return process.env.NEXT_PUBLIC_BEYOND_CONNECT_URL;
  }

  const baseUrl = publicAppUrl();
  
  // Si on est sur localhost, s'assurer que c'est bien pour Beyond Connect
  if (baseUrl.includes("localhost")) {
    return baseUrl;
  }
  
  // Sinon, utiliser le domaine Beyond Connect si configuré
  return baseUrl;
}

