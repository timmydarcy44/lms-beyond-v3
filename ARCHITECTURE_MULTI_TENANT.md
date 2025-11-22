# Architecture Multi-Tenant pour Beyond Care, Beyond Note et Beyond No School

## 🎯 Objectif

Permettre la commercialisation indépendante de :
- **Beyond No School** (www.beyond-noschool.fr) - Catalogue de formations
- **Beyond Care** (www.beyond-care.fr) - Bien-être mental
- **Beyond Note** (www.beyond-note.fr) - Transformation de documents

Chaque site a :
- ✅ Son propre domaine
- ✅ Son propre branding (couleurs, logo, style)
- ✅ Une page vitrine style Netflix
- ✅ Inscription simplifiée (juste email)
- ✅ Système d'abonnement Stripe
- ✅ Partage de la base de données Supabase

---

## 🏗️ Architecture Proposée

### Option 1 : Multi-Domain avec Next.js (Recommandé)

```
┌─────────────────────────────────────────────────────────────┐
│                    Base de Code Unique                       │
│                  (Monorepo Next.js)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ beyond-      │  │ beyond-      │  │ beyond-      │      │
│  │ noschool.fr  │  │ care.fr      │  │ note.fr      │      │
│  │              │  │              │  │              │      │
│  │ - Landing    │  │ - Landing    │  │ - Landing    │      │
│  │ - Signup     │  │ - Signup     │  │ - Signup     │      │
│  │ - Catalog    │  │ - Dashboard  │  │ - Dashboard  │      │
│  │ - Checkout   │  │ - Checkout   │  │ - Checkout   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Middleware de Détection de Domaine            │   │
│  │  (Détermine le tenant basé sur le domaine)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              APIs Partagées                           │   │
│  │  - /api/auth/*                                        │   │
│  │  - /api/catalogue/*                                   │   │
│  │  - /api/stripe/*                                      │   │
│  │  - /api/beyond-care/*                                 │   │
│  │  - /api/beyond-note/*                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase (Base de Données Partagée)             │
│                                                               │
│  - profiles (utilisateurs)                                   │
│  - super_admins (tenants)                                    │
│  - super_admin_branding (branding par tenant)                │
│  - catalog_items (contenus)                                  │
│  - subscriptions (abonnements Stripe)                        │
│  - beyond_note_documents                                     │
│  - mental_health_questionnaires                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Structure de Fichiers Proposée

```
src/
├── app/
│   ├── (tenant)/
│   │   ├── layout.tsx              # Layout tenant-aware
│   │   ├── page.tsx                # Landing page dynamique
│   │   ├── signup/
│   │   │   └── page.tsx            # Inscription simplifiée (email)
│   │   ├── login/
│   │   │   └── page.tsx            # Connexion
│   │   └── dashboard/
│   │       └── page.tsx            # Dashboard selon tenant
│   │
│   ├── api/
│   │   ├── tenant/
│   │   │   └── route.ts            # API pour détecter le tenant
│   │   ├── auth/
│   │   │   └── signup-email-only/  # Inscription simplifiée
│   │   └── subscriptions/
│   │       └── route.ts            # Gestion abonnements
│   │
│   └── middleware.ts               # Détection de domaine
│
├── lib/
│   ├── tenant/
│   │   ├── config.ts               # Configuration des tenants
│   │   ├── detection.ts            # Détection du tenant
│   │   └── branding.ts             # Récupération du branding
│   │
│   └── subscriptions/
│       └── stripe.ts               # Gestion abonnements Stripe
│
└── components/
    ├── tenant/
    │   ├── landing-page.tsx        # Landing page dynamique
    │   ├── signup-form.tsx         # Formulaire inscription email
    │   └── subscription-modal.tsx  # Modal abonnement
    │
    └── shared/                     # Composants partagés
```

---

## 🔧 Implémentation

### 1. Configuration des Tenants

```typescript
// src/lib/tenant/config.ts

export type TenantId = 'beyond-noschool' | 'beyond-care' | 'beyond-note';

export interface TenantConfig {
  id: TenantId;
  domain: string;
  name: string;
  superAdminEmail: string;
  features: {
    catalog: boolean;
    beyondCare: boolean;
    beyondNote: boolean;
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
    },
    subscriptionPlans: {
      monthly: 14.99,
      yearly: 149.99,
    },
  },
};
```

### 2. Middleware de Détection

```typescript
// src/app/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TENANTS } from '@/lib/tenant/config';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const tenant = TENANTS[hostname];

  if (tenant) {
    // Ajouter le tenant dans les headers pour les routes API
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenant.id);
    requestHeaders.set('x-tenant-domain', tenant.domain);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 3. Inscription Simplifiée (Email uniquement)

```typescript
// src/app/api/auth/signup-email-only/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { TENANTS } from '@/lib/tenant/config';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const hostname = request.headers.get('host') || '';
    const tenant = TENANTS[hostname];

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant non trouvé' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    
    // Créer l'utilisateur avec un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-12);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/set-password`,
        data: {
          tenant_id: tenant.id,
          super_admin_email: tenant.superAdminEmail,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Créer le profil avec le rôle "learner" B2C
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role: 'learner',
        org_id: null, // B2C
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Un email de confirmation a été envoyé',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

### 4. Système d'Abonnement Stripe

```typescript
// src/app/api/subscriptions/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { TENANTS } from '@/lib/tenant/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json(); // 'monthly' | 'yearly'
    const hostname = request.headers.get('host') || '';
    const tenant = TENANTS[hostname];

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant non trouvé' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const price = tenant.subscriptionPlans[plan as 'monthly' | 'yearly'];

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${tenant.name} - Abonnement ${plan === 'monthly' ? 'Mensuel' : 'Annuel'}`,
              description: `Accès complet à ${tenant.name}`,
            },
            unit_amount: Math.round(price * 100),
            recurring: {
              interval: plan === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/signup`,
      metadata: {
        user_id: user.id,
        tenant_id: tenant.id,
        plan,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

### 5. Landing Page Dynamique

```typescript
// src/components/tenant/landing-page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant/config';

interface LandingPageProps {
  tenant: TenantConfig;
  branding: any;
}

export function LandingPage({ tenant, branding }: LandingPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/auth/signup-email-only', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      router.push('/signup/check-email');
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: branding?.background_color || '#000',
        color: branding?.text_primary_color || '#fff',
      }}
    >
      {/* Hero Section Style Netflix */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-6xl font-bold mb-4">{tenant.name}</h1>
        <p className="text-xl mb-8 text-center max-w-2xl">
          {tenant.features.catalog && 'Accédez à notre catalogue complet de formations'}
          {tenant.features.beyondCare && 'Suivez votre bien-être mental avec des outils intelligents'}
          {tenant.features.beyondNote && 'Transformez vos documents avec l\'IA'}
        </p>
        
        <form onSubmit={handleSignup} className="flex gap-4 max-w-md w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            className="flex-1 px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/60"
            required
          />
          <button
            type="submit"
            className="px-8 py-3 rounded font-semibold"
            style={{ 
              backgroundColor: branding?.accent_color || '#e50914',
              color: '#fff',
            }}
          >
            Commencer
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 🗄️ Modifications Base de Données

### Table `subscriptions`

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL, -- 'beyond-noschool', 'beyond-care', 'beyond-note'
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL, -- 'monthly', 'yearly'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
```

---

## 🚀 Déploiement

### Vercel Multi-Domain

1. **Configuration Vercel** :
   - Ajouter les domaines dans Vercel : `beyond-noschool.fr`, `beyond-care.fr`, `beyond-note.fr`
   - Tous pointent vers le même projet Next.js

2. **Variables d'environnement** :
   ```env
   NEXT_PUBLIC_APP_URL=https://beyond-noschool.fr
   STRIPE_SECRET_KEY=sk_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   ```

3. **DNS** :
   - Pointer les domaines vers Vercel
   - SSL automatique via Vercel

---

## ✅ Avantages de cette Architecture

1. **Code unique** : Maintenance simplifiée
2. **Base de données partagée** : Utilisateurs unifiés
3. **Branding personnalisé** : Chaque tenant a son identité
4. **Scalable** : Facile d'ajouter de nouveaux tenants
5. **Coûts réduits** : Un seul déploiement Vercel

---

## 📝 Prochaines Étapes

1. ✅ Créer la configuration des tenants
2. ✅ Implémenter le middleware de détection
3. ✅ Créer l'API d'inscription simplifiée
4. ✅ Créer le système d'abonnement Stripe
5. ✅ Créer les landing pages dynamiques
6. ✅ Ajouter la table `subscriptions` en base
7. ✅ Tester avec les domaines de développement



