/**
 * Utilitaires pour Beyond Connect
 */

/**
 * Obtient l'URL de base pour Beyond Connect
 * En production, utilise le domaine Beyond Connect, sinon utilise NEXT_PUBLIC_APP_URL
 */
export function getBeyondConnectBaseUrl(): string {
  // En production, utiliser le domaine Beyond Connect
  if (process.env.NEXT_PUBLIC_BEYOND_CONNECT_URL) {
    return process.env.NEXT_PUBLIC_BEYOND_CONNECT_URL;
  }
  
  // En développement, utiliser localhost avec le port approprié
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Si on est sur localhost, s'assurer que c'est bien pour Beyond Connect
  if (baseUrl.includes("localhost")) {
    return baseUrl;
  }
  
  // Sinon, utiliser le domaine Beyond Connect si configuré
  return baseUrl;
}

