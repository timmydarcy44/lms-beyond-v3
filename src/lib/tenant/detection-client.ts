'use client';

import { getTenantFromHostname, TenantConfig } from './config';

/**
 * Récupère le tenant depuis les cookies (client-side uniquement)
 * À utiliser uniquement dans les Client Components
 */
export function getTenantFromCookies(): TenantConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const tenantId = document.cookie
    .split('; ')
    .find(row => row.startsWith('tenant-id='))
    ?.split('=')[1];
  
  if (tenantId) {
    const domain = document.cookie
      .split('; ')
      .find(row => row.startsWith('tenant-domain='))
      ?.split('=')[1] || '';
    
    // Reconstruire la config depuis l'ID
    return getTenantFromHostname(window.location.host);
  }
  
  return getTenantFromHostname(window.location.host);
}



