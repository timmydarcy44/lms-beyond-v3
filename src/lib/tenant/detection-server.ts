import { headers } from 'next/headers';
import { getTenantFromHostname, TenantConfig } from './config';

/**
 * Récupère le tenant depuis les headers (server-side uniquement)
 * À utiliser uniquement dans les Server Components
 */
export async function getTenantFromHeaders(): Promise<TenantConfig | null> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const tenantId = headersList.get('x-tenant-id');
  
  if (tenantId) {
    // Le middleware a déjà détecté le tenant
    const domain = headersList.get('x-tenant-domain') || '';
    const name = headersList.get('x-tenant-name') || '';
    const superAdminEmail = headersList.get('x-super-admin-email') || '';
    
    return {
      id: tenantId as any,
      domain,
      name,
      superAdminEmail,
      features: {
        catalog: tenantId === 'beyond-noschool' || tenantId === 'jessica-contentin',
        beyondCare: tenantId === 'beyond-care',
        beyondNote: tenantId === 'beyond-note',
        beyondConnect: tenantId === 'beyond-connect',
      },
      subscriptionPlans: {
        monthly: tenantId === 'beyond-noschool' ? 29.99 : tenantId === 'beyond-care' ? 19.99 : tenantId === 'jessica-contentin' ? 0 : 14.99,
        yearly: tenantId === 'beyond-noschool' ? 299.99 : tenantId === 'beyond-care' ? 199.99 : tenantId === 'jessica-contentin' ? 0 : 149.99,
      },
    };
  }
  
  // Fallback: détecter depuis le hostname
  return getTenantFromHostname(hostname);
}



