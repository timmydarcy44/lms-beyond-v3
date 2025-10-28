# LMS - Learning Management System

## 🚀 Démarrage rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration Supabase

#### Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez l'URL et les clés API

#### Créer le fichier .env.local
Dans la racine du projet, créez un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Créer la table formations
Dans l'éditeur SQL de Supabase, exécutez :

```sql
CREATE TABLE formations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  visibility_mode TEXT DEFAULT 'public',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer des données de test
INSERT INTO formations (title, visibility_mode, published) VALUES
('Introduction à React', 'public', true),
('Next.js Avancé', 'private', true),
('TypeScript Fundamentals', 'public', false);
```

### 3. Démarrer le serveur
```bash
npm run dev
```

## 📁 Structure du projet

```
LMS/
├── app/
│   ├── app/                    # Zone protégée (authentification requise)
│   │   ├── dashboard/          # Tableau de bord avec formations
│   │   └── layout.tsx          # Layout protégé
│   ├── login/                  # Page de connexion Supabase
│   ├── config/                 # Page de configuration
│   └── page.tsx                # Page d'accueil
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Navigation avec menu utilisateur
│   │   └── ClientShell.tsx     # Transitions et parallax
│   └── ui/                     # Composants UI premium
├── lib/
│   └── supabase/
│       ├── client.ts           # Client Supabase (browser)
│       └── server.ts           # Client Supabase (server)
├── middleware.ts               # Protection des routes /app
└── styles/
    └── globals.css             # Thème dark premium
```

## 🎨 Design

- **Thème** : Dark premium (#252525)
- **Typographie** : SF Pro Display/Text
- **Couleurs** : Gradients iris, blush, lime
- **Effets** : Glassmorphism, glow, animations Framer Motion
- **Style** : Apple × Nike inspiration

## 🔐 Authentification

- **Méthode** : Email OTP / Magic Link (Supabase Auth)
- **Protection** : Middleware sur toutes les routes `/app/*`
- **Session** : Persistante avec auto-refresh
- **Déconnexion** : Bouton dans la navbar

## 📊 Dashboard

- **Formations** : Lecture depuis Supabase avec RLS
- **Affichage** : Cartes glass avec statut publié/brouillon
- **Tri** : Par date de création (plus récentes en premier)

## 🛠️ Technologies

- **Framework** : Next.js 15 (App Router)
- **Styling** : TailwindCSS + thème custom
- **Animations** : Framer Motion (client components uniquement)
- **Auth** : Supabase Auth UI
- **Database** : Supabase PostgreSQL
- **TypeScript** : Strict mode

## 🚀 Déploiement

1. Configurez les variables d'environnement sur votre plateforme
2. Déployez sur Vercel, Netlify, ou votre hébergeur préféré
3. Assurez-vous que Supabase est configuré en production

## 📝 Notes

- Les composants Framer Motion sont marqués `'use client'`
- Le middleware protège automatiquement `/app/*`
- La page `/config` guide la configuration Supabase
- Design responsive et accessible (AA+)
