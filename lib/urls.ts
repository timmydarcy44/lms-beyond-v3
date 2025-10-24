/**
 * Utilitaires pour la construction d'URLs avec gestion des organisations
 */

/**
 * Remplace ou ajoute le slug d'organisation dans une URL
 * @param path - Le chemin (ex: "/admin/dashboard", "/admin/formations/123")
 * @param orgSlug - Le slug de l'organisation
 * @returns L'URL avec le bon slug d'org
 */
export function withOrg(path: string, orgSlug: string): string {
  // Normaliser le slug en minuscule
  const normalizedSlug = orgSlug.toLowerCase();
  
  // Si le chemin commence par /admin/ ou /app/, remplacer le slug
  if (path.startsWith('/admin/') || path.startsWith('/app/')) {
    const parts = path.split('/');
    if (parts.length >= 3) {
      parts[2] = normalizedSlug;
      return parts.join('/');
    }
  }
  
  // Sinon, ajouter le slug
  if (path.startsWith('/admin')) {
    return `/admin/${normalizedSlug}${path.slice(6)}`;
  }
  if (path.startsWith('/app')) {
    return `/app/${normalizedSlug}${path.slice(4)}`;
  }
  
  return path;
}

/**
 * Construit une URL admin avec organisation
 * @param path - Le chemin relatif (ex: "dashboard", "formations/123")
 * @param orgSlug - Le slug de l'organisation
 * @returns L'URL complète
 */
export function adminUrl(path: string, orgSlug: string): string {
  const normalizedSlug = orgSlug.toLowerCase();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/admin/${normalizedSlug}/${cleanPath}`;
}

/**
 * Construit une URL app (apprenant) avec organisation
 * @param path - Le chemin relatif (ex: "dashboard", "courses/123")
 * @param orgSlug - Le slug de l'organisation
 * @returns L'URL complète
 */
export function appUrl(path: string, orgSlug: string): string {
  const normalizedSlug = orgSlug.toLowerCase();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/app/${normalizedSlug}/${cleanPath}`;
}

/**
 * Extrait le slug d'organisation d'une URL
 * @param path - Le chemin à analyser
 * @returns Le slug d'org ou null
 */
export function extractOrgSlug(path: string): string | null {
  const match = path.match(/^\/(admin|app)\/([^\/]+)/);
  return match ? match[2] : null;
}

/**
 * Vérifie si un chemin nécessite un slug d'organisation
 * @param path - Le chemin à vérifier
 * @returns true si le chemin nécessite un slug d'org
 */
export function requiresOrgSlug(path: string): boolean {
  return path.startsWith('/admin/') || path.startsWith('/app/');
}
