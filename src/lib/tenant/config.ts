export type TenantId = 'beyond-noschool' | 'beyond-care' | 'beyond-note' | 'beyond-connect' | 'jessica-contentin' | 'jessica-contentin-app';

export interface TenantConfig {
  id: TenantId;
  domain: string;
  name: string;
  superAdminEmail: string;
  features: {
    catalog: boolean;
    beyondCare: boolean;
    beyondNote: boolean;
    beyondConnect: boolean;
  };
  subscriptionPlans: {
    monthly: number;  // Prix en euros
    yearly: number;
  };
}

export const TENANTS: Record<string, TenantConfig> = {
  'beyond-noschool.fr': {
    id: 'beyond-noschool',
    domain: 'beyond-noschool.fr',
    name: 'Beyond No School',
    superAdminEmail: 'timdarcypro@gmail.com',
    features: {
      catalog: true,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 29.99,
      yearly: 299.99,
    },
  },
  'www.beyond-noschool.fr': {
    id: 'beyond-noschool',
    domain: 'beyond-noschool.fr',
    name: 'Beyond No School',
    superAdminEmail: 'timdarcypro@gmail.com',
    features: {
      catalog: true,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 29.99,
      yearly: 299.99,
    },
  },
  'beyond-care.fr': {
    id: 'beyond-care',
    domain: 'beyond-care.fr',
    name: 'Beyond Care',
    superAdminEmail: 'contentin.cabinet@gmail.com',
    features: {
      catalog: false,
      beyondCare: true,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 19.99,
      yearly: 199.99,
    },
  },
  'beyond-note.fr': {
    id: 'beyond-note',
    domain: 'beyond-note.fr',
    name: 'Beyond Note',
    superAdminEmail: 'timdarcypro@gmail.com',
    features: {
      catalog: false,
      beyondCare: false,
      beyondNote: true,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 14.99,
      yearly: 149.99,
    },
  },
  'beyond-connect.fr': {
    id: 'beyond-connect',
    domain: 'beyond-connect.fr',
    name: 'Beyond Connect',
    superAdminEmail: 'timdarcypro@gmail.com',
    features: {
      catalog: false,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: true,
    },
    subscriptionPlans: {
      monthly: 24.99,
      yearly: 249.99,
    },
  },
  'jessica-contentin.fr': {
    id: 'jessica-contentin',
    domain: 'jessica-contentin.fr',
    name: 'Jessica CONTENTIN - Psychopédagogue',
    superAdminEmail: 'contentin.cabinet@gmail.com',
    features: {
      catalog: true,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 0,
      yearly: 0,
    },
  },
  'www.jessica-contentin.fr': {
    id: 'jessica-contentin',
    domain: 'jessica-contentin.fr',
    name: 'Jessica CONTENTIN - Psychopédagogue',
    superAdminEmail: 'contentin.cabinet@gmail.com',
    features: {
      catalog: true,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 0,
      yearly: 0,
    },
  },
  'jessicacontentin.fr': {
    id: 'jessica-contentin',
    domain: 'jessicacontentin.fr',
    name: 'Jessica CONTENTIN - Psychopédagogue',
    superAdminEmail: 'contentin.cabinet@gmail.com',
    features: {
      catalog: true,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 0,
      yearly: 0,
    },
  },
  'www.jessicacontentin.fr': {
    id: 'jessica-contentin',
    domain: 'jessicacontentin.fr',
    name: 'Jessica CONTENTIN - Psychopédagogue',
    superAdminEmail: 'contentin.cabinet@gmail.com',
    features: {
      catalog: true,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 0,
      yearly: 0,
    },
  },
  'app.jessicacontentin.fr': {
    id: 'jessica-contentin-app',
    domain: 'app.jessicacontentin.fr',
    name: 'Jessica CONTENTIN - Ressources',
    superAdminEmail: 'contentin.cabinet@gmail.com',
    features: {
      catalog: true,
      beyondCare: false,
      beyondNote: false,
      beyondConnect: false,
    },
    subscriptionPlans: {
      monthly: 0,
      yearly: 0,
    },
  },
  // Note: localhost n'est PAS un tenant - c'est pour le LMS classique
  // Pour tester les tenants en local, utilisez des domaines de test dans /etc/hosts
};

/**
 * Site vitrine Jessica (pas app.jessicacontentin.fr).
 * Utilisé en filet si le Host n’est pas une clé exacte de TENANTS mais doit quand même résoudre le tenant Jessica.
 */
export function isJessicaContentinMarketingHostname(hostname: string): boolean {
  const raw = hostname.split(":")[0]?.trim().toLowerCase() ?? "";
  const h = raw.replace(/^www\./, "");
  if (!h || h.startsWith("app.")) return false;
  return (
    h === "jessicacontentin.fr" ||
    h === "jessica-contentin.fr" ||
    h.endsWith(".jessicacontentin.fr") ||
    h.endsWith(".jessica-contentin.fr")
  );
}

/**
 * Détecte le tenant basé sur le hostname
 */
export function getTenantFromHostname(hostname: string): TenantConfig | null {
  // Enlever le port si présent (ex. localhost:3001 -> localhost)
  const host = hostname.split(':')[0];
  const fullHost = hostname;
  
  // Chercher d'abord le hostname complet
  if (TENANTS[fullHost]) {
    return TENANTS[fullHost];
  }
  
  // Chercher sans le port
  if (TENANTS[host]) {
    return TENANTS[host];
  }
  
  // Chercher par domaine de base (sans sous-domaine)
  const parts = host.split('.');
  if (parts.length >= 2) {
    const baseDomain = parts.slice(-2).join('.');
    if (TENANTS[baseDomain]) {
      return TENANTS[baseDomain];
    }
  }

  if (isJessicaContentinMarketingHostname(host)) {
    return TENANTS["jessicacontentin.fr"];
  }

  return null;
}

/**
 * Récupère le tenant par son ID
 */
export function getTenantById(tenantId: TenantId): TenantConfig | null {
  return Object.values(TENANTS).find(t => t.id === tenantId) || null;
}

